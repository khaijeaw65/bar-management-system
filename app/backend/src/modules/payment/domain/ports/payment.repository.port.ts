import type { NewPayment, PaymentRecord, TodayPaymentRecord } from '../payment.types.js';

export abstract class PaymentRepository {
  public abstract insert(payment: NewPayment, orderIds: readonly string[]): Promise<PaymentRecord>;
  public abstract lockById(id: string): Promise<PaymentRecord | null>;
  public abstract save(payment: PaymentRecord): Promise<PaymentRecord>;
  public abstract findById(id: string): Promise<PaymentRecord | null>;
  public abstract findPendingByVisit(visitId: string): Promise<PaymentRecord | null>;
  public abstract hasPending(): Promise<boolean>;
  public abstract listByVisit(visitId: string): Promise<PaymentRecord[]>;
  public abstract coveredOrderIds(visitId: string): Promise<string[]>;
  public abstract pendingVisitIds(visitIds: readonly string[]): Promise<string[]>;
  public abstract findToday(from: Date, to: Date): Promise<TodayPaymentRecord[]>;
}
