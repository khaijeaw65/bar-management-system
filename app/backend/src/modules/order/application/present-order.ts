import type { Order, StaffRef, Ticket } from '@bar/contracts';
import { orderTotal, withLineTotals } from './fold-orders.js';
import type { FoldedOrder, FoldedTicket } from './folded-order.types.js';

export interface TicketView extends Ticket {
  visitId: string;
}

export function toOrder(folded: FoldedOrder, names: ReadonlyMap<string, string>): Order {
  const priced = withLineTotals(folded);
  return {
    id: priced.id,
    visitId: priced.visitId,
    orderNumber: priced.orderNumber,
    businessDate: priced.businessDate,
    createdAt: priced.createdAt,
    createdBy: staffRef(priced.createdById, names),
    tickets: priced.tickets.map((ticket) => toTicket(ticket, names)),
    total: orderTotal(priced),
  };
}

export function toTicket(ticket: FoldedTicket, names: ReadonlyMap<string, string>): TicketView {
  return {
    id: ticket.id,
    orderId: ticket.orderId,
    visitId: ticket.visitId,
    orderNumber: ticket.orderNumber,
    station: ticket.station,
    status: ticket.status,
    seat: ticket.seat,
    items: ticket.items,
    acceptedBy: staffRef(accepterId(ticket), names),
    sentAt: ticket.sentAt,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export function withoutVisit(ticket: TicketView): Ticket {
  const { visitId: _visitId, ...body } = ticket;
  return body;
}

function accepterId(ticket: FoldedTicket): string | null {
  if (ticket.status !== 'accepted') return null;
  return ticket.updatedById;
}

function staffRef(id: string | null, names: ReadonlyMap<string, string>): StaffRef | null {
  if (!id) return null;
  return { staffId: id, displayName: names.get(id) ?? 'พนักงาน' };
}
