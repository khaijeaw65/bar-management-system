import type { Bill, ManualConfirmReason, PaymentMethod } from '@bar/contracts';

export interface CreatePaymentInput {
  visitId: string;
  method: PaymentMethod;
}

export interface MarkPaidInput {
  paymentId: string;
  via: 'manual' | 'cash';
  reason: ManualConfirmReason | null;
  note: string | null;
}

export interface BillSnapshot {
  bill: Bill;
  uncoveredOrderIds: string[];
}

export interface PaymentExpiryJob {
  paymentId: string;
}

export const PAYMENT_EXPIRY_QUEUE = 'payment-expiry';
