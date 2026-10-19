import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  TICKET_ISSUE_ESCALATED,
  TICKET_STATUS_CHANGED,
  type FlagIssueRequest,
  type OrderStatus,
  type ResolveIssueRequest,
  type Ticket,
  type TicketIssueEscalatedPayload,
  type TicketStatusChangedPayload,
} from '@bar/contracts';
import { blankToNull } from '../../../common/http/http-input.js';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../domain/order.repository.js';
import type { LockedTicket, TicketIssueWrite, TicketLineState } from '../domain/order.types.js';
import { OrderQueryService } from './order-query.service.js';
import { withoutVisit, type TicketView } from './present-order.js';
import { issueStatus, nextTicketStatus, readyStepApplies, type TicketAction } from './ticket-transition.js';

type TicketEvent = 'status' | 'escalated';

@Injectable()
export class TicketService {
  public constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly venues: VenueSettingsService,
    private readonly query: OrderQueryService,
    private readonly staff: StaffUserService,
    private readonly notifications: NotificationsService,
  ) {}

  public async accept(id: string, staffId: string): Promise<Ticket> {
    await this.apply(id, 'accept');
    return this.finish(id, staffId);
  }

  public async ready(id: string, staffId: string): Promise<Ticket> {
    await this.apply(id, 'ready');
    return this.finish(id, staffId);
  }

  public async send(id: string, staffId: string): Promise<Ticket> {
    await this.apply(id, 'send');
    return this.finish(id, staffId);
  }

  public async flagIssue(id: string, staffId: string, input: FlagIssueRequest): Promise<Ticket> {
    await this.writeFlag(id, staffId, input);
    return this.finish(id, staffId);
  }

  public async resolveIssue(id: string, staffId: string, input: ResolveIssueRequest): Promise<Ticket> {
    await this.writeResolve(id, input);
    const kind = input.resolution === 'escalate' ? 'escalated' : 'status';
    return this.finish(id, staffId, kind);
  }

  private async finish(id: string, staffId: string, kind: TicketEvent = 'status'): Promise<Ticket> {
    const ticket = await this.query.ticketById(id);
    const staff = await this.staff.findById(staffId);
    this.emit(ticket, staffId, staff?.displayName, kind);
    return withoutVisit(ticket);
  }

  @Transactional()
  private async apply(id: string, action: TicketAction): Promise<void> {
    const locked = await this.requireTicket(id);
    const readyStep = await this.readyStep(locked);
    const status = nextTicketStatus(action, locked.status, readyStep);
    await this.orders.saveStatus(id, status, this.sentAt(action, status, locked, this.clock.now()));
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

  @Transactional()
  private async writeFlag(id: string, staffId: string, input: FlagIssueRequest): Promise<void> {
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
  }

  @Transactional()
  private async writeResolve(id: string, input: ResolveIssueRequest): Promise<void> {
    const locked = await this.requireTicket(id);
    const escalated = locked.issueEscalatedAt !== null;
    const status = issueStatus(input.resolution, locked.status, escalated);
    await this.orders.saveIssue(id, this.afterResolve(status, input.resolution, locked));
  }

  private emit(
    ticket: TicketView,
    staffId: string,
    displayName: string | undefined,
    kind: TicketEvent,
  ): void {
    if (kind === 'escalated') {
      this.notifications.emitToStaff(TICKET_ISSUE_ESCALATED, this.escalatedPayload(ticket, staffId, displayName));
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
  ): TicketIssueEscalatedPayload {
    const issue = ticket.issue;
    if (!issue?.escalatedAt) throw new Error('escalated ticket is missing its issue');
    return {
      ticketId: ticket.id,
      orderId: ticket.orderId,
      visitId: ticket.visitId,
      orderNumber: ticket.orderNumber,
      seatLabel: ticket.seat.label,
      reason: issue.reason,
      escalatedAt: issue.escalatedAt,
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
      updatedBy: { staffId, displayName: displayName ?? 'พนักงาน' },
    };
  }
}
