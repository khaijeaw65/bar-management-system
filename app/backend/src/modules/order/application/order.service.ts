import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ORDER_CREATED, VISIT_STATE_CHANGED, type Order } from '@bar/contracts';
import { MenuCatalogService } from '../../menu/application/menu-catalog.service.js';
import { CLOCK, type Clock } from '../../../common/clock.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../domain/order.repository.js';
import type { NewOrder, NewTicket, PricedLine, TicketBucket } from '../domain/order.types.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import { VisitService } from '../../venue/application/visit.service.js';
import { businessDate } from './business-date.js';
import { bucketFor, priceLines } from './order-lines.js';
import type { PlaceOrderInput } from './order.types.js';
import { OrderQueryService } from './order-query.service.js';

@Injectable()
export class OrderService {
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
    this.publish(outcome, order);
    return order;
  }

  @Transactional()
  private async insert(input: PlaceOrderInput): Promise<PlacedOrder> {
    const claim = await this.visits.claimForOrder(input.visitId);
    const draft = await this.draft(input);
    const orderId = await this.orders.insert({ ...draft, visitId: input.visitId });
    return { ...claim, orderId };
  }

  private async draft(input: PlaceOrderInput): Promise<Omit<NewOrder, 'visitId'>> {
    const settings = await this.venues.get();
    const now = this.clock.now();
    const date = businessDate(now, settings.businessDayCutoff);
    return {
      orderNumber: await this.orders.nextNumber(date),
      businessDate: date,
      tickets: this.groupTickets(await this.priced(input, now), settings.kitchenDisplayEnabled),
      placedAt: now,
    };
  }

  private async priced(input: PlaceOrderInput, now: Date): Promise<PricedLine[]> {
    const lookup = await this.menu.getOrderable(input.items.map((item) => item.variantId), now);
    return priceLines(input.items, lookup);
  }

  private publish(outcome: PlacedOrder, order: Order): void {
    if (outcome.activated) this.emitActivated(outcome);
    this.notifications.emitToStaff(ORDER_CREATED, order);
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
  visitId: string;
  tableSeatId: string;
}
