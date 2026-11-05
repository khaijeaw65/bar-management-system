import { Injectable } from '@nestjs/common';
import type { CustomerTab } from '@bar/contracts';
import { Clock } from '../../../common/clock.js';
import { OrderQueryService } from '../../order/application/order-query.service.js';
import type { GuestSessionView } from '../domain/guest-session.types.js';
import { emptyCustomerTab, foldCustomerTab } from './customer-tab.js';

@Injectable()
export class CustomerTabService {
  public constructor(
    private readonly orders: OrderQueryService,
    private readonly clock: Clock,
  ) {}

  public async get(guest: GuestSessionView): Promise<CustomerTab> {
    const asOf = this.clock.now();
    if (!guest.visitId) return emptyCustomerTab(asOf);
    return foldCustomerTab({
      visitId: guest.visitId,
      orders: await this.orders.forVisit(guest.visitId),
      placedBy: await this.orders.guestSessionIds(guest.visitId),
      sessionId: guest.id,
      asOf,
    });
  }
}
