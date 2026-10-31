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

export abstract class OrderRepository {
  public abstract nextNumber(businessDate: string): Promise<number>;
  public abstract insert(order: NewOrder): Promise<string>;
  public abstract lockTicket(id: string): Promise<LockedTicket | null>;
  public abstract saveStatus(id: string, status: LockedTicket['status'], sentAt: Date | null): Promise<void>;
  public abstract saveIssue(id: string, issue: TicketIssueWrite): Promise<void>;
  public abstract lineOnTicket(ticketId: string, itemId: string): Promise<TicketLineState>;
  public abstract rows(query: OrderQuery): Promise<OrderRow[]>;
  public abstract bills(visitIds: readonly string[]): Promise<BillRow[]>;
  public abstract orderTotals(visitId: string): Promise<OrderTotal[]>;
  /** order id → guest session id, only for guest orders on this visit. */
  public abstract guestSessionIds(visitId: string): Promise<Map<string, string>>;
  public abstract pendingLinesForItem(menuItemId: string): Promise<PendingItemLine[]>;
  /** `payment.status = 'pending'` for this visit. Same fact as `findPendingByVisit`, read here so Order does not import Payment. */
  public abstract hasPendingPayment(visitId: string): Promise<boolean>;
  public abstract cancelLines(ids: readonly string[], at: Date, reason: string): Promise<void>;
  public abstract countActiveLines(ticketId: string): Promise<number>;
}
