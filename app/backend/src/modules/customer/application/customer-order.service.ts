import { Injectable } from '@nestjs/common';
import {
  CustomerPlaceOrderSchema,
  type CustomerPlaceOrder,
  type CustomerPlaceOrderResult,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { blankToNull } from '../../../common/http/http-input.js';
import { IdempotencyService } from '../../../common/idempotency/idempotency.service.js';
import { requestHash } from '../../../common/idempotency/request-hash.js';
import { OrderService } from '../../order/application/order.service.js';
import type { RequestedLine } from '../../order/application/order.types.js';
import type { GuestSessionView } from '../domain/guest-session.types.js';
import { CustomerThrottle } from './customer-throttle.js';
import { CustomerTabGateway } from './customer-tab-gateway.js';
import { GuestSessionService } from './guest-session.service.js';

const ORDER_GAP_SECONDS = 10;

@Injectable()
export class CustomerOrderService {
  public constructor(
    private readonly orders: OrderService,
    private readonly sessions: GuestSessionService,
    private readonly idempotency: IdempotencyService,
    private readonly throttle: CustomerThrottle,
    private readonly tabs: CustomerTabGateway,
  ) {}

  /** Replay first (the same key must not hit the 10 s gap), then the gap, then the write. */
  public async place(
    guest: GuestSessionView,
    body: unknown,
    key: string | null,
  ): Promise<CustomerPlaceOrderResult> {
    const parsed = CustomerPlaceOrderSchema.parse(body);
    const scope = `customer-order:${guest.id}`;
    const hash = requestHash(parsed);
    const gate = await this.idempotency.begin<CustomerPlaceOrderResult>({ scope, key, hash });
    if (gate.kind === 'replay') return gate.body;
    try {
      const result = await this.write(guest, parsed.items);
      await this.idempotency.finish({ scope, key, hash, body: result });
      return result;
    } catch (error) {
      await this.idempotency.cancel(scope, key);
      throw error;
    }
  }

  private async write(
    guest: GuestSessionView,
    items: CustomerPlaceOrder['items'],
  ): Promise<CustomerPlaceOrderResult> {
    const gapKey = `customer:order:${guest.id}`;
    if (!(await this.throttle.acquire(gapKey, ORDER_GAP_SECONDS))) {
      throw new DomainException('RATE_LIMITED', 'กรุณารอสักครู่ก่อนสั่งอีกครั้ง', 429);
    }
    try {
      const order = await this.orders.placeAsGuest({
        guestSessionId: guest.id,
        tableSeatId: guest.seat.id,
        visitId: guest.visitId,
        items: items.map((item) => this.line(item, guest)),
        bindVisit: (visitId) => this.sessions.bindVisit(guest.id, visitId),
      });
      if (!guest.visitId) await this.tabs.bindSession(guest.id, order.visitId);
      return { orderId: order.id, orderNumber: order.orderNumber, visitId: order.visitId };
    } catch (error) {
      await this.throttle.release(gapKey);
      throw error;
    }
  }

  // The nickname comes from the session at send time — never from the body (CD-06 R4).
  private line(
    item: CustomerPlaceOrder['items'][number],
    guest: GuestSessionView,
  ): RequestedLine {
    return {
      variantId: item.variantId,
      quantity: item.quantity,
      modifierOptionIds: item.modifierOptionIds ?? [],
      orderedByName: guest.displayName,
      notes: blankToNull(item.notes),
    };
  }
}
