import type { CustomerTab, CustomerTabOrder, Order, OrderLine } from '@bar/contracts';
import { sumSatang } from '../../../common/money.js';

/**
 * Folds the staff view of a visit's orders into the guest's running tab (BRIEF-048).
 * Built field by field from snapshots: no staff names or ids, no other sessions' ids — `mine` is the only trace.
 */
export function foldCustomerTab(input: {
  visitId: string;
  orders: readonly Order[];
  /** order id → guest session id, guest orders only. */
  placedBy: ReadonlyMap<string, string>;
  sessionId: string;
  asOf: Date;
}): CustomerTab {
  const orders = [...input.orders].sort(newestFirst).map((order) => tabOrder(order, input));
  return {
    visitId: input.visitId,
    orders,
    total: sumSatang(input.orders.map((order) => order.total)),
    asOf: input.asOf.toISOString(),
  };
}

export function emptyCustomerTab(asOf: Date): CustomerTab {
  return { visitId: null, orders: [], total: '0.00', asOf: asOf.toISOString() };
}

function newestFirst(left: Order, right: Order): number {
  const byTime = right.createdAt.localeCompare(left.createdAt);
  return byTime !== 0 ? byTime : right.orderNumber - left.orderNumber;
}

function tabOrder(order: Order, input: { placedBy: ReadonlyMap<string, string>; sessionId: string }): CustomerTabOrder {
  return {
    orderNumber: order.orderNumber,
    placedAt: order.createdAt,
    mine: input.placedBy.get(order.id) === input.sessionId,
    // The charge ticket has no station: its lines show, its status does not (CD-06 D3).
    tickets: order.tickets.flatMap((ticket) =>
      ticket.station ? [{ station: ticket.station, status: ticket.status }] : [],
    ),
    lines: order.tickets.flatMap((ticket) => ticket.items.map(tabLine)),
  };
}

function tabLine(line: OrderLine): CustomerTabOrder['lines'][number] {
  return {
    itemName: line.name,
    variantName: line.variantName,
    modifiers: line.modifiers.map((modifier) => modifier.name),
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
    orderedByName: line.orderedByName,
    cancelled: line.cancelledAt !== null,
  };
}
