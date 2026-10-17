import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  TICKET_STATUS_CHANGED,
  type OrderStatus,
  type Ticket,
  type TicketStatusChangedPayload,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import { CLOCK, type Clock } from '../domain/clock.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../domain/order.repository.js';
import type { LockedTicket } from '../domain/order.types.js';
import { AcceptedByStore } from './accepted-by.store.js';
import { OrderQueryService } from './order-query.service.js';
import type { TicketView } from './present-order.js';
import { nextTicketStatus, readyStepApplies, type TicketAction } from './ticket-transition.js';

@Injectable()
export class TicketService {
  public constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly venues: VenueSettingsService,
    private readonly query: OrderQueryService,
    private readonly staff: StaffUserService,
    private readonly notifications: NotificationsService,
    private readonly acceptedBy: AcceptedByStore,
  ) {}

  public async accept(id: string, staffId: string): Promise<Ticket> {
    await this.apply(id, 'accept');
    await this.acceptedBy.remember(id, staffId);
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

  private async finish(id: string, staffId: string): Promise<Ticket> {
    const ticket = await this.query.ticketById(id);
    await this.emit(ticket, staffId);
    return withoutVisit(ticket);
  }

  @Transactional()
  private async apply(id: string, action: TicketAction): Promise<void> {
    const locked = await this.requireTicket(id);
    const readyStep = await this.readyStep(locked);
    const status = nextTicketStatus(action, locked.status, readyStep);
    await this.orders.saveStatus(id, status, sentAt(action, status, locked, this.clock.now()));
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

  private async emit(ticket: TicketView, staffId: string): Promise<void> {
    const staff = await this.staff.findById(staffId);
    this.notifications.emitToStaff(
      TICKET_STATUS_CHANGED,
      payload(ticket, staffId, staff?.displayName),
    );
  }
}

function sentAt(action: TicketAction, status: OrderStatus, locked: LockedTicket, now: Date): Date | null {
  if (action === 'send' && status === 'sent') return now;
  return locked.sentAt;
}

function payload(
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

function withoutVisit(ticket: TicketView): Ticket {
  const { visitId: _visitId, ...body } = ticket;
  return body;
}
