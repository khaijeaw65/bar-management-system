import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  TICKET_ISSUE_ESCALATED,
  TICKET_STATUS_CHANGED,
  type FlagIssueRequest,
  type OrderStatus,
  type ResolveIssueRequest,
  type Ticket,
  type TicketIssueEscalatedPayload,
  type TicketIssueReason,
  type TicketStatusChangedPayload,
} from '@bar/contracts';
import { blankToNull } from '../../../common/http/http-input.js';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { NotificationRecipients } from '../../notifications/application/notification-recipients.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import { Clock } from '../../../common/clock.js';
import { OrderRepository } from '../domain/order.repository.js';
import type { LockedTicket, TicketIssueWrite, TicketLineState } from '../domain/order.types.js';
import { OrderQueryService } from './order-query.service.js';
import { withoutVisit, type TicketView } from './present-order.js';
import { issueStatus, nextTicketStatus, readyStepApplies, type TicketAction } from './ticket-transition.js';
import type { ResolvedTicket, TicketEvent } from './ticket.types.js';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  public constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
    private readonly venues: VenueSettingsService,
    private readonly query: OrderQueryService,
    private readonly staff: StaffUserService,
    private readonly notifications: NotificationsService,
    private readonly notificationRecipients: NotificationRecipients,
  ) {}

  public async accept(id: string, staffId: string): Promise<Ticket> {
    return this.publish(await this.apply(id, 'accept'), staffId, 'status');
  }

  public async ready(id: string, staffId: string): Promise<Ticket> {
    const outcome = await this.apply(id, 'ready');
    const result = await this.publish(outcome, staffId, 'status');
    await this.notifyFoodReady(outcome);
    return result;
  }

  public async send(id: string, staffId: string): Promise<Ticket> {
    return this.publish(await this.apply(id, 'send'), staffId, 'status');
  }

  public async flagIssue(id: string, staffId: string, input: FlagIssueRequest): Promise<Ticket> {
    return this.publish(await this.writeFlag(id, staffId, input), staffId, 'status');
  }

  public async resolveIssue(id: string, staffId: string, input: ResolveIssueRequest): Promise<Ticket> {
    const outcome = await this.writeResolve(id, input);
    return this.publish(outcome.ticket, staffId, outcome.kind, outcome.written);
  }

  /**
   * Cancels a ticket whose lines are all voided. Returns null when a line is still active.
   * The caller emits `ticket.status_changed` after its own transaction commits.
   */
  public async cancelWhenEmpty(id: string): Promise<TicketView | null> {
    return this.cancelEmpty(id);
  }

  @Transactional()
  private async apply(id: string, action: TicketAction): Promise<TicketView> {
    const locked = await this.requireTicket(id);
    const readyStep = await this.readyStep(locked);
    const status = nextTicketStatus(action, locked.status, readyStep);
    await this.orders.saveStatus(id, status, this.sentAt(action, status, locked, this.clock.now()));
    return this.query.ticketById(id);
  }

  @Transactional()
  private async writeFlag(id: string, staffId: string, input: FlagIssueRequest): Promise<TicketView> {
    const locked = await this.requireTicket(id);
    const status = issueStatus('flag', locked.status, false);
    const itemId = await this.activeItem(id, input.itemId ?? null);
    await this.orders.saveIssue(id, {
      status,
      reason: input.reason,
      itemId,
      note: blankToNull(input.note),
      reportedBy: staffId,
      escalatedAt: null,
    });
    return this.query.ticketById(id);
  }

  @Transactional()
  private async writeResolve(id: string, input: ResolveIssueRequest): Promise<ResolvedTicket> {
    const locked = await this.requireTicket(id);
    const escalated = locked.issueEscalatedAt !== null;
    const status = issueStatus(input.resolution, locked.status, escalated);
    const written = this.afterResolve(status, input.resolution, locked);
    await this.orders.saveIssue(id, written);
    return {
      ticket: await this.query.ticketById(id),
      kind: input.resolution === 'escalate' ? 'escalated' : 'status',
      written,
    };
  }

  @Transactional()
  private async cancelEmpty(id: string): Promise<TicketView | null> {
    const locked = await this.requireTicket(id);
    if (locked.status === 'cancelled') return null;
    if ((await this.orders.countActiveLines(id)) > 0) return null;
    await this.orders.saveStatus(id, 'cancelled', locked.sentAt);
    return this.query.ticketById(id);
  }

  private async publish(
    ticket: TicketView,
    staffId: string,
    kind: TicketEvent,
    written?: TicketIssueWrite,
  ): Promise<Ticket> {
    const staff = await this.staff.findById(staffId);
    this.emit(ticket, staffId, staff?.displayName, kind, written);
    return withoutVisit(ticket);
  }

  private async requireTicket(id: string): Promise<LockedTicket> {
    const locked = await this.orders.lockTicket(id);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบใบงาน', 404);
    return locked;
  }

  private async readyStep(ticket: LockedTicket): Promise<boolean> {
    const settings = await this.venues.get();
    return readyStepApplies(settings.kitchenDisplayEnabled, ticket.seatKind);
  }

  private async notifyFoodReady(ticket: TicketView): Promise<void> {
    if (ticket.status !== 'ready') {
      return;
    }
    try {
      const order = await this.query.getById(ticket.orderId);
      const creatorId = order.createdBy?.staffId ?? null;
      const recipients = await this.notificationRecipients.foodReady(creatorId);
      await this.notifications.notify('food_ready', recipients, {
        title: `ออเดอร์ #${ticket.orderNumber} พร้อมเสิร์ฟ`,
        body: ticket.seat.label,
        refType: 'order',
        refId: ticket.orderId,
      });
    } catch (error) {
      this.logger.warn(`food ready notification failed: ${error instanceof Error ? error.message : 'error'}`);
    }
  }

  private emit(
    ticket: TicketView,
    staffId: string,
    displayName: string | undefined,
    kind: TicketEvent,
    written?: TicketIssueWrite,
  ): void {
    this.notifications.emitTabChanged(ticket.visitId);
    if (kind === 'escalated') {
      this.notifications.emitToStaff(
        TICKET_ISSUE_ESCALATED,
        this.escalatedPayload(ticket, staffId, displayName, written),
      );
      return;
    }
    this.notifications.emitToStaff(TICKET_STATUS_CHANGED, this.payload(ticket, staffId, displayName));
  }

  private sentAt(action: TicketAction, status: OrderStatus, locked: LockedTicket, now: Date): Date | null {
    if (action === 'send' && status === 'sent') return now;
    return locked.sentAt;
  }

  private async activeItem(ticketId: string, itemId: string | null): Promise<string | null> {
    if (!itemId) return null;
    const state = await this.orders.lineOnTicket(ticketId, itemId);
    if (state === 'active') return itemId;
    throw new DomainException('VALIDATION_ERROR', this.lineMessage(state), 400);
  }

  private lineMessage(state: TicketLineState): string {
    if (state === 'cancelled') return 'รายการนี้ถูกยกเลิกแล้ว';
    return 'รายการนี้ไม่อยู่ในใบงาน';
  }

  private afterResolve(
    status: OrderStatus,
    resolution: ResolveIssueRequest['resolution'],
    locked: LockedTicket,
  ): TicketIssueWrite {
    if (resolution === 'substitute') return this.cleared(status);
    return this.kept(status, locked, this.clock.now());
  }

  private cleared(status: OrderStatus): TicketIssueWrite {
    return { status, reason: null, itemId: null, note: null, reportedBy: null, escalatedAt: null };
  }

  private kept(status: OrderStatus, locked: LockedTicket, at: Date): TicketIssueWrite {
    return {
      status,
      reason: locked.issueReason,
      itemId: locked.issueItemId,
      note: locked.issueNote,
      reportedBy: locked.issueReportedBy,
      escalatedAt: at,
    };
  }

  private escalatedPayload(
    ticket: TicketView,
    staffId: string,
    displayName: string | undefined,
    written: TicketIssueWrite | undefined,
  ): TicketIssueEscalatedPayload {
    const reason = this.reasonOf(written?.reason ?? null);
    if (!reason || !written?.escalatedAt) throw new Error('escalated ticket is missing its issue');
    return {
      ticketId: ticket.id,
      orderId: ticket.orderId,
      visitId: ticket.visitId,
      orderNumber: ticket.orderNumber,
      seatLabel: ticket.seat.label,
      reason,
      escalatedAt: written.escalatedAt.toISOString(),
      updatedAt: ticket.updatedAt,
      escalatedBy: { staffId, displayName: displayName ?? 'พนักงาน' },
    };
  }

  private payload(
    ticket: TicketView,
    staffId: string,
    displayName: string | undefined,
  ): TicketStatusChangedPayload {
    return {
      ticketId: ticket.id,
      orderId: ticket.orderId,
      visitId: ticket.visitId,
      status: ticket.status,
      updatedAt: ticket.updatedAt,
      updatedBy: { staffId, displayName: displayName ?? 'พนักงาน' },
    };
  }

  private reasonOf(value: string | null): TicketIssueReason | null {
    if (value === 'out_of_stock' || value === 'equipment' || value === 'other') return value;
    return null;
  }
}
