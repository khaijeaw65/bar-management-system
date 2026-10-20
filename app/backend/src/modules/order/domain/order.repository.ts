import type {
  BillRow,
  LockedTicket,
  NewOrder,
  OrderQuery,
  OrderTotal,
  TicketIssueWrite,
  TicketLineState,
} from './order.types.js';
import type { OrderRow } from './order-row.types.js';

export interface OrderRepository {
  nextNumber(businessDate: string): Promise<number>;
  insert(order: NewOrder): Promise<string>;
  lockTicket(id: string): Promise<LockedTicket | null>;
  saveStatus(id: string, status: LockedTicket['status'], sentAt: Date | null): Promise<void>;
  saveIssue(id: string, issue: TicketIssueWrite): Promise<void>;
  lineOnTicket(ticketId: string, itemId: string): Promise<TicketLineState>;
  rows(query: OrderQuery): Promise<OrderRow[]>;
  bills(visitIds: readonly string[]): Promise<BillRow[]>;
  orderTotals(visitId: string): Promise<OrderTotal[]>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
