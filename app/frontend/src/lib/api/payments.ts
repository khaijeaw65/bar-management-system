import {
  PaymentAttemptSchema,
  PaymentSchema,
  TodayPaymentsResponseSchema,
  type MarkPaid,
  type Payment,
  type PaymentAttempt,
  type PaymentMethod,
  type TodayPaymentsResponse,
} from "@bar/contracts";
import { apiGet, apiPost } from "./client";

export function getTodayPayments(): Promise<TodayPaymentsResponse> {
  return apiGet("/payments/today", TodayPaymentsResponseSchema);
}

export function createPayment(visitId: string, method: PaymentMethod, idempotencyKey: string): Promise<PaymentAttempt> {
  return apiPost(`/visits/${visitId}/payments`, { method, mode: "merge" }, PaymentAttemptSchema, { idempotencyKey });
}

export function getPayment(paymentId: string): Promise<Payment> {
  return apiGet(`/payments/${paymentId}`, PaymentSchema);
}

export function cancelPayment(paymentId: string): Promise<Payment> {
  return apiPost(`/payments/${paymentId}/cancel`, undefined, PaymentSchema);
}

export function markPaymentPaid(paymentId: string, body: MarkPaid): Promise<Payment> {
  return apiPost(`/payments/${paymentId}/mark-paid`, body, PaymentSchema);
}

export function verifySlip(paymentId: string, body: { payload: string } | { image: string }): Promise<Payment> {
  return apiPost(`/payments/${paymentId}/verify-slip`, body, PaymentSchema);
}
