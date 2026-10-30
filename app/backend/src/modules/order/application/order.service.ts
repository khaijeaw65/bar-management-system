import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ORDER_CREATED, VISIT_STATE_CHANGED, type Order } from '@bar/contracts';
import {
  MenuCatalogService,
  type OrderableLookup,
} from '../../menu/application/menu-catalog.service.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../domain/order.repository.js';
import type { NewOrder, NewTicket, PricedLine, TicketBucket } from '../domain/order.types.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import { VisitService } from '../../venue/application/visit.service.js';
import { businessDateUnder } from './business-date.js';
import { bucketFor, priceLines } from './order-lines.js';
import type { GuestOrderInput, PlaceOrderInput } from './order.types.js';
import { OrderQueryService } from './order-query.service.js';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  public constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly visits: VisitService,
    private readonly venues: VenueSettingsService,
    private readonly menu: MenuCatalogService,
    private readonly notifications: NotificationsService,
    private readonly query: OrderQueryService,
  ) {}

  public async place(input: PlaceOrderInput): Promise<Order> {
    const outcome = await this.insert(input);
    const order = await this.query.getById(outcome.orderId);
    await this.publish(outcome, order);
    return order;
  }

  /** The guest path writes through the same code as staff (one order writer); only the visit resolution differs. */
  public async placeAsGuest(input: GuestOrderInput): Promise<Order> {
    const outcome = await this.insertForGuest(input);
    const order = await this.query.getById(outcome.orderId);
    await this.publish(outcome, order);
    return order;
  }

  @Transactional()
  private async insert(input: PlaceOrderInput): Promise<PlacedOrder> {
    const now = this.clock.now();
    const lookup = await this.lockMenu(input, now);
    const claim = await this.visits.claimForOrder(input.visitId);
    const draft = await this.draft(input, lookup, now);
    const orderId = await this.orders.insert({ ...draft, visitId: input.visitId });
    return { ...claim, orderId, opened: false };
  }

  @Transactional()
  private async insertForGuest(input: GuestOrderInput): Promise<PlacedOrder> {
    const now = this.clock.now();
    const lookup = await this.lockMenu(input, now);
    // Charge lines (service charge, corkage…) are staff-only (CD-06 §9).
    if (lookup.found.some((variant) => variant.itemType === 'charge')) {
      throw new DomainException('VALIDATION_ERROR', 'รายการนี้สั่งเองไม่ได้ กรุณาติดต่อพนักงาน', 400);
    }
    const opened = input.visitId ? null : await this.visits.openForGuest(input.tableSeatId);
    const visitId = input.visitId ?? opened?.visitId;
    if (!visitId) throw new Error('guest order has no visit');
    const claim = await this.visits.claimForOrder(visitId);
    if (opened) await input.bindVisit(visitId);
    const draft = await this.draft(input, lookup, now);
    const orderId = await this.orders.insert({ ...draft, visitId, guestSessionId: input.guestSessionId });
    return { ...claim, orderId, opened: opened?.created ?? false };
  }

  // Menu rows before the visit, matching an 86 (menu → visit → ticket) so the two cannot deadlock.
  private lockMenu(input: PlaceOrderInput | GuestOrderInput, now: Date): Promise<OrderableLookup> {
    return this.menu.getOrderable(
      input.items.map((item) => item.variantId),
      now,
      { lock: 'share' },
    );
  }

  private async draft(
    input: PlaceOrderInput | GuestOrderInput,
    lookup: OrderableLookup,
    now: Date,
  ): Promise<Omit<NewOrder, 'visitId'>> {
    const settings = await this.venues.get();
    const date = businessDateUnder(now, await this.venues.businessDayRule());
    return {
      orderNumber: await this.orders.nextNumber(date),
      businessDate: date,
      tickets: this.groupTickets(priceLines(input.items, lookup), settings.kitchenDisplayEnabled),
      placedAt: now,
    };
  }

  // The order is committed: a failed announcement is logged, never turned into a failed order.
  private async publish(outcome: PlacedOrder, order: Order): Promise<void> {
    try {
      if (outcome.opened) await this.visits.announceOpened(outcome.tableSeatId);
      if (outcome.activated) this.emitActivated(outcome);
      this.notifications.emitToStaff(ORDER_CREATED, order);
      this.notifications.emitTabChanged(outcome.visitId);
    } catch (error) {
      this.logger.warn(`order ${order.id} announce failed: ${error instanceof Error ? error.message : 'error'}`);
    }
  }

  private emitActivated(outcome: PlacedOrder): void {
    this.notifications.emitToPos(VISIT_STATE_CHANGED, {
      visitId: outcome.visitId,
      tableSeatId: outcome.tableSeatId,
      state: 'active',
    });
  }

  private groupTickets(lines: readonly PricedLine[], kitchenOn: boolean): NewTicket[] {
    const groups = new Map<TicketBucket, PricedLine[]>();
    for (const line of lines) {
      const bucket = bucketFor(line, kitchenOn);
      groups.set(bucket, [...(groups.get(bucket) ?? []), line]);
    }
    return [...groups.entries()].map(([bucket, grouped]) => ({ bucket, lines: grouped }));
  }
}

interface PlacedOrder {
  orderId: string;
  activated: boolean;
  opened: boolean;
  visitId: string;
  tableSeatId: string;
}
