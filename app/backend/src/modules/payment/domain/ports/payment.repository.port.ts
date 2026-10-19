import type { NewPayment, PaymentRecord } from '../payment.types.js';

export interface PaymentRepository {
  insert(payment: NewPayment, orderIds: readonly string[]): Promise<PaymentRecord>;
  lockById(id: string): Promise<PaymentRecord | null>;
  save(payment: PaymentRecord): Promise<PaymentRecord>;
  findById(id: string): Promise<PaymentRecord | null>;
  findPendingByVisit(visitId: string): Promise<PaymentRecord | null>;
  hasPending(): Promise<boolean>;
  listByVisit(visitId: string): Promise<PaymentRecord[]>;
  coveredOrderIds(visitId: string): Promise<string[]>;
  pendingVisitIds(visitIds: readonly string[]): Promise<string[]>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
