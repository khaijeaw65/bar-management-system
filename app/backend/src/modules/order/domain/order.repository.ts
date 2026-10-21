import type {
  BillRow,
  LockedTicket,
  NewOrder,
  OrderQuery,
  OrderTotal,
  PendingItemLine,
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
  pendingLinesForItem(menuItemId: string): Promise<PendingItemLine[]>;
  /** `payment.status = 'pending'` for this visit. Same fact as `findPendingByVisit`, read here so Order does not import Payment. */
  hasPendingPayment(visitId: string): Promise<boolean>;
  cancelLines(ids: readonly string[], at: Date, reason: string): Promise<void>;
  countActiveLines(ticketId: string): Promise<number>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
