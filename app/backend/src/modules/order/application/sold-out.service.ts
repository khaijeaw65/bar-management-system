import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ClsService } from 'nestjs-cls';
import {
  MENU_AVAILABILITY_CHANGED,
  TICKET_STATUS_CHANGED,
  type AvailabilityTicket,
  type MarkAvailabilityResult,
  type MenuItem,
  type NotVoidedTicket,
  type OrderStatus,
} from '@bar/contracts';
import { Clock } from '../../../common/clock.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { MenuCatalogService } from '../../menu/application/menu-catalog.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { VisitService } from '../../venue/application/visit.service.js';
import { ORDER_REPOSITORY, type OrderRepository } from '../domain/order.repository.js';
import type { PendingItemLine } from '../domain/order.types.js';
import type { TicketView } from './present-order.js';
import type { SeatRef, ToggleOutcome } from './sold-out.types.js';
import { TicketService } from './ticket.service.js';

const SOLD_OUT_REASON = 'ของหมด';

@Injectable()
export class SoldOutService {
  public constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly clock: Clock,
    private readonly menu: MenuCatalogService,
    private readonly visits: VisitService,
    private readonly tickets: TicketService,
    private readonly staff: StaffUserService,
    private readonly notifications: NotificationsService,
    private readonly cls: ClsService,
  ) {}

  public async markUnavailable(itemId: string, staffId: string): Promise<MarkAvailabilityResult> {
    return this.finish(itemId, false, staffId);
  }

  public async markAvailable(itemId: string, staffId: string): Promise<MarkAvailabilityResult> {
    return this.finish(itemId, true, staffId);
  }

  private async finish(itemId: string, available: boolean, staffId: string): Promise<MarkAvailabilityResult> {
    const outcome = await this.toggle(itemId, available);
    if (outcome.changed) await this.publish(outcome, staffId);
    return { item: outcome.item, autoVoided: outcome.autoVoided, notVoided: outcome.notVoided };
  }

  @Transactional()
  private async toggle(itemId: string, available: boolean): Promise<ToggleOutcome> {
    const change = await this.menu.setAvailability(itemId, available);
    const empty = this.untouched(change.item, available, change.changed);
    if (!change.changed || available) return empty;
    const voided = await this.voidLines(await this.orders.pendingLinesForItem(itemId));
    return { ...empty, ...voided };
  }

  private async voidLines(lines: readonly PendingItemLine[]): Promise<Pick<ToggleOutcome, 'autoVoided' | 'notVoided' | 'cancelled' | 'voidedVisits'>> {
    const autoVoided: AvailabilityTicket[] = [];
    const notVoided: NotVoidedTicket[] = [];
    const cancelled: TicketView[] = [];
    const voidedVisits: string[] = [];
    for (const visitId of this.visitIds(lines)) {
      const visitLines = lines.filter((line) => line.visitId === visitId);
      const outcome = await this.voidVisit(visitId, visitLines);
      autoVoided.push(...outcome.autoVoided);
      notVoided.push(...outcome.notVoided);
      cancelled.push(...outcome.cancelled);
      if (outcome.autoVoided.length > 0) voidedVisits.push(visitId);
    }
    return { autoVoided: this.bySeat(autoVoided), notVoided: this.bySeat(notVoided), cancelled, voidedVisits };
  }

  private async voidVisit(
    visitId: string,
    lines: readonly PendingItemLine[],
  ): Promise<Pick<ToggleOutcome, 'autoVoided' | 'notVoided' | 'cancelled'>> {
    const skipped = { autoVoided: [], notVoided: [], cancelled: [] };
    if (!(await this.visits.lockIfLive(visitId))) return skipped;
    if (await this.orders.hasPendingPayment(visitId)) {
      return { ...skipped, notVoided: this.groups(lines).map((group) => this.held(group, this.heldReason(group))) };
    }
    return this.voidTickets(lines);
  }

  private async voidTickets(
    lines: readonly PendingItemLine[],
  ): Promise<Pick<ToggleOutcome, 'autoVoided' | 'notVoided' | 'cancelled'>> {
    const autoVoided: AvailabilityTicket[] = [];
    const notVoided: NotVoidedTicket[] = [];
    const cancelled: TicketView[] = [];
    const now = this.clock.now();
    // System cancel: cancelled_by stays null, and the subscriber must not stamp the staff who tapped 86.
    const actor = this.cls.get('userId');
    this.cls.set('userId', undefined);
    try {
      for (const group of this.groups(lines)) {
        const ticketId = group[0]?.ticketId;
        if (!ticketId) continue;
        const locked = await this.orders.lockTicket(ticketId);
        if (!locked || locked.status !== 'pending') {
          notVoided.push(this.held(group, 'in_progress'));
          continue;
        }
        await this.orders.cancelLines(group.map((line) => line.itemId), now, SOLD_OUT_REASON);
        const emptied = await this.tickets.cancelWhenEmpty(ticketId);
        if (emptied) cancelled.push(emptied);
        autoVoided.push(this.voided(group, emptied ? 'cancelled' : 'pending'));
      }
    } finally {
      if (typeof actor === 'string') this.cls.set('userId', actor);
    }
    return { autoVoided, notVoided, cancelled };
  }

  private untouched(item: MenuItem, available: boolean, changed: boolean): ToggleOutcome {
    return { changed, available, item, autoVoided: [], notVoided: [], cancelled: [], voidedVisits: [] };
  }

  private async publish(outcome: ToggleOutcome, staffId: string): Promise<void> {
    const staff = await this.staff.findById(staffId);
    const updatedBy = { staffId, displayName: staff?.displayName ?? 'พนักงาน' };
    this.notifications.emitToStaff(MENU_AVAILABILITY_CHANGED, {
      menuItemId: outcome.item.id,
      name: outcome.item.name,
      isAvailable: outcome.available,
      autoVoided: outcome.autoVoided,
      notVoided: outcome.notVoided,
    });
    for (const visitId of outcome.voidedVisits) this.notifications.emitTabChanged(visitId);
    for (const ticket of outcome.cancelled) {
      this.notifications.emitToStaff(TICKET_STATUS_CHANGED, {
        ticketId: ticket.id,
        orderId: ticket.orderId,
        visitId: ticket.visitId,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
        updatedBy,
      });
    }
  }

  private visitIds(lines: readonly PendingItemLine[]): string[] {
    const ids: string[] = [];
    for (const line of lines) {
      if (!ids.includes(line.visitId)) ids.push(line.visitId);
    }
    return ids;
  }

  private groups(lines: readonly PendingItemLine[]): PendingItemLine[][] {
    const grouped = new Map<string, PendingItemLine[]>();
    for (const line of lines) {
      const list = grouped.get(line.ticketId) ?? [];
      list.push(line);
      grouped.set(line.ticketId, list);
    }
    return [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, list]) => list);
  }

  private bySeat<T extends SeatRef>(rows: T[]): T[] {
    return [...rows].sort(
      (left, right) => left.seatLabel.localeCompare(right.seatLabel, 'en') || left.ticketId.localeCompare(right.ticketId),
    );
  }

  private voided(lines: readonly PendingItemLine[], ticketStatus: OrderStatus): AvailabilityTicket {
    return { ...this.ref(lines), ticketStatus };
  }

  private heldReason(lines: readonly PendingItemLine[]): NotVoidedTicket['reason'] {
    return lines[0]?.ticketStatus === 'pending' ? 'payment_pending' : 'in_progress';
  }

  private held(lines: readonly PendingItemLine[], reason: NotVoidedTicket['reason']): NotVoidedTicket {
    return { ...this.ref(lines), reason };
  }

  private ref(lines: readonly PendingItemLine[]): Omit<AvailabilityTicket, 'ticketStatus'> {
    const first = lines[0];
    if (!first) throw new Error('sold-out group is empty');
    return {
      ticketId: first.ticketId,
      orderNumber: first.orderNumber,
      seatLabel: first.seatLabel,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }
}
