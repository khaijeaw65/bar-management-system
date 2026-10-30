import { Inject, Injectable } from '@nestjs/common';
import type { Order, Ticket, TicketListQuery } from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../domain/order.repository.js';
import type { OrderQuery, OrderTotal } from '../domain/order.types.js';
import { foldOrders } from './fold-orders.js';
import type { FoldedOrder } from './folded-order.types.js';
import type { VisitBill } from './order.types.js';
import { toOrder, withoutVisit, type TicketView } from './present-order.js';
import { listFilter } from './ticket-query.js';

@Injectable()
export class OrderQueryService {
  public constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly staff: StaffUserService,
  ) {}

  public async getById(id: string): Promise<Order> {
    const found = await this.load({ orderId: id, excludeCharge: false });
    const order = found[0];
    if (!order) throw new DomainException('NOT_FOUND', 'ไม่พบออเดอร์', 404);
    return order;
  }

  public async forVisit(visitId: string): Promise<Order[]> {
    return this.load({ visitId, excludeCharge: false });
  }

  public async tickets(query: TicketListQuery): Promise<Ticket[]> {
    const filter = listFilter(query);
    const views = await this.ticketViews({
      visitId: query.visitId,
      statuses: filter.statuses,
      excludeCharge: true,
      escalatedOnly: filter.escalatedOnly,
    });
    return views.map(withoutVisit);
  }

  public async orderTotals(visitId: string): Promise<OrderTotal[]> {
    return this.orders.orderTotals(visitId);
  }

  public async guestSessionIds(visitId: string): Promise<ReadonlyMap<string, string>> {
    return this.orders.guestSessionIds(visitId);
  }

  public async billsFor(visitIds: readonly string[]): Promise<Map<string, VisitBill>> {
    const rows = await this.orders.bills(visitIds);
    return new Map(rows.map((row) => [row.visitId, { total: row.total, itemCount: row.itemCount }]));
  }

  public async ticketById(id: string): Promise<TicketView> {
    const views = await this.ticketViews({ ticketId: id, excludeCharge: false });
    const found = views[0];
    if (!found) throw new DomainException('NOT_FOUND', 'ไม่พบใบงาน', 404);
    return found;
  }

  private async load(query: OrderQuery): Promise<Order[]> {
    const folded = foldOrders(await this.orders.rows(query));
    const names = await this.namesFor(folded);
    return folded.map((order) => toOrder(order, names));
  }

  private async ticketViews(query: OrderQuery): Promise<TicketView[]> {
    const orders = await this.load(query);
    return orders.flatMap((order) =>
      order.tickets.map((ticket) => ({ ...ticket, visitId: order.visitId })),
    );
  }

  private async namesFor(orders: readonly FoldedOrder[]): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    for (const id of this.staffIds(orders)) {
      const staff = await this.staff.findById(id);
      if (staff) names.set(id, staff.displayName);
    }
    return names;
  }

  private staffIds(orders: readonly FoldedOrder[]): string[] {
    const ids = new Set<string>();
    for (const order of orders) {
      if (order.createdById) ids.add(order.createdById);
      for (const ticket of order.tickets) {
        if (ticket.updatedById) ids.add(ticket.updatedById);
        if (ticket.issueReportedById) ids.add(ticket.issueReportedById);
        for (const item of ticket.items) {
          if (item.cancelledById) ids.add(item.cancelledById);
        }
      }
    }
    return [...ids];
  }
}
