import type { KitchenStation, OrderLine, OrderStatus, TableSeatKind, TicketIssueReason } from '@bar/contracts';
import type { OrderRow } from '../domain/order-row.types.js';
import { money } from '../../../common/money.js';
import type { FoldedLine, FoldedOrder, FoldedTicket } from './folded-order.types.js';

export function foldOrders(rows: readonly OrderRow[]): FoldedOrder[] {
  const orders = new Map<string, FoldedOrder>();
  const tickets = new Map<string, FoldedTicket>();
  const items = new Map<string, FoldedLine>();
  for (const row of rows) addRow(orders, tickets, items, row);
  return [...orders.values()];
}

function addRow(
  orders: Map<string, FoldedOrder>,
  tickets: Map<string, FoldedTicket>,
  items: Map<string, FoldedLine>,
  row: OrderRow,
): void {
  const order = orderOf(orders, row);
  const ticket = ticketOf(tickets, order, row);
  const item = itemOf(items, ticket, row);
  if (row.optionId && row.optionName && row.priceDelta) {
    item.modifiers.push({
      optionId: row.optionId,
      name: row.optionName,
      priceDelta: money(row.priceDelta),
    });
  }
}

function orderOf(orders: Map<string, FoldedOrder>, row: OrderRow): FoldedOrder {
  const existing = orders.get(row.orderId);
  if (existing) return existing;
  const created: FoldedOrder = {
    id: row.orderId,
    visitId: row.visitId,
    orderNumber: row.orderNumber,
    businessDate: row.businessDate,
    createdAt: row.orderCreatedAt.toISOString(),
    createdById: row.orderCreatedBy,
    tickets: [],
  };
  orders.set(row.orderId, created);
  return created;
}

function ticketOf(
  tickets: Map<string, FoldedTicket>,
  order: FoldedOrder,
  row: OrderRow,
): FoldedTicket {
  const existing = tickets.get(row.ticketId);
  if (existing) return existing;
  const created = newTicket(order, row);
  tickets.set(row.ticketId, created);
  order.tickets.push(created);
  return created;
}

function newTicket(order: FoldedOrder, row: OrderRow): FoldedTicket {
  return {
    id: row.ticketId,
    orderId: order.id,
    visitId: order.visitId,
    orderNumber: order.orderNumber,
    station: stationOf(row.station),
    status: statusOf(row.status),
    seat: { id: row.seatId, label: row.seatLabel, kind: kindOf(row.seatKind) },
    items: [],
    ...issueOf(row),
    updatedById: row.ticketUpdatedBy,
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    createdAt: row.ticketCreatedAt.toISOString(),
    updatedAt: row.ticketUpdatedAt.toISOString(),
  };
}

function issueOf(row: OrderRow) {
  return {
    issueReason: reasonOf(row.issueReason),
    issueItemId: row.issueItemId,
    issueNote: row.issueNote,
    issueReportedById: row.issueReportedById,
    issueEscalatedAt: row.issueEscalatedAt ? row.issueEscalatedAt.toISOString() : null,
  };
}

function reasonOf(value: string | null): TicketIssueReason | null {
  if (value === null) return null;
  if (value === 'out_of_stock' || value === 'equipment' || value === 'other') return value;
  throw new Error('order row has an unknown issue reason');
}

function itemOf(items: Map<string, FoldedLine>, ticket: FoldedTicket, row: OrderRow): FoldedLine {
  const existing = items.get(row.itemId);
  if (existing) return existing;
  const created = newLine(row);
  items.set(row.itemId, created);
  ticket.items.push(created);
  return created;
}

function newLine(row: OrderRow): FoldedLine {
  const isComp = row.cancelKind === 'comp';
  const isVoid = row.cancelKind === 'void' || (!row.cancelKind && row.cancelledAt !== null);

  return {
    id: row.itemId,
    variantId: row.variantId,
    name: row.itemName,
    variantName: row.variantName,
    quantity: row.quantity,
    unitPrice: money(row.unitPrice),
    modifiers: [],
    lineTotal: '0.00',
    orderedByName: row.orderedByName,
    notes: row.notes,
    cancelledAt: isVoid && row.cancelledAt ? row.cancelledAt.toISOString() : null,
    cancellation: isVoid ? cancellationOf(row) : null,
    comp: isComp ? compOf(row) : null,
    cancelledById: (isVoid || isComp) ? row.cancelledBy : null,
    approvedById: (isVoid || isComp) ? row.approvedBy : null,
  };
}

function cancellationOf(row: OrderRow): OrderLine['cancellation'] {
  if (!row.cancelledAt) return null;
  return {
    at: row.cancelledAt.toISOString(),
    reason: row.cancelReason,
    by: null,
    system: row.cancelledBy === null,
    approvedBy: null,
    selfApproved: row.cancelledBy !== null && row.approvedBy === null,
  };
}

function compOf(row: OrderRow): OrderLine['comp'] {
  if (!row.cancelledAt) return null;
  return {
    at: row.cancelledAt.toISOString(),
    by: null,
    approvedBy: null,
    selfApproved: row.cancelledBy !== null && row.approvedBy === null,
    reason: row.cancelReason,
    note: row.cancelNote,
  };
}

export function withLineTotals(order: FoldedOrder): FoldedOrder {
  for (const ticket of order.tickets) {
    for (const item of ticket.items) item.lineTotal = lineTotal(item);
  }
  return order;
}

export function orderTotal(order: FoldedOrder): string {
  const cents = order.tickets
    .flatMap((ticket) => ticket.items)
    .filter((item) => item.cancelledAt === null)
    .reduce((sum, item) => sum + toLineCents(item), 0);
  return fromCents(cents);
}

function lineTotal(item: OrderLine): string {
  return fromCents(toLineCents(item));
}

function toLineCents(item: OrderLine): number {
  if (item.comp !== null) return 0;
  return lineCents(item.unitPrice, item.modifiers.map((modifier) => modifier.priceDelta), item.quantity);
}

function stationOf(value: string | null): KitchenStation | null {
  if (value === 'bar' || value === 'food') return value;
  if (value === null) return null;
  throw new Error('order row has an unknown station');
}

function statusOf(value: string): OrderStatus {
  if (isStatus(value)) return value;
  throw new Error('order row has an unknown status');
}

function isStatus(value: string): value is OrderStatus {
  return ['pending', 'accepted', 'ready', 'sent', 'issue', 'cancelled'].includes(value);
}

function kindOf(value: string): TableSeatKind {
  if (value === 'table' || value === 'counter') return value;
  throw new Error('order row has an unknown seat kind');
}

function toCents(value: string): number {
  const negative = value.startsWith('-');
  const [whole = '0', fraction = ''] = value.replace('-', '').split('.');
  const cents = Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
  return negative ? -cents : cents;
}

function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${Math.trunc(absolute / 100)}.${fraction}`;
}

function lineCents(unit: string, deltas: readonly string[], quantity: number): number {
  const one = deltas.reduce((sum, delta) => sum + toCents(delta), toCents(unit));
  return one * quantity;
}
