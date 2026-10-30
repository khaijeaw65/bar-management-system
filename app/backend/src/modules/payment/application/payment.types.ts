import type { Bill, ManualConfirmReason, PaymentMethod } from '@bar/contracts';
import type { SlipCheck } from '../domain/ports/slip-verifier.port.js';

export interface CreatePaymentInput {
  visitId: string;
  method: PaymentMethod;
  /** Set when a guest phone creates the payment (BRIEF-052). */
  guestSessionId?: string;
}

export interface MarkPaidInput {
  paymentId: string;
  via: 'manual' | 'cash';
  reason: ManualConfirmReason | null;
  note: string | null;
}

export interface VerifySlipInput {
  paymentId: string;
  slip: SlipCheck;
}

export interface BillSnapshot {
  bill: Bill;
  uncoveredOrderIds: string[];
}

export interface PaymentExpiryJob {
  paymentId: string;
}

export const PAYMENT_EXPIRY_QUEUE = 'payment-expiry';
