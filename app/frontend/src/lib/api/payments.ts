import {
  PaymentAttemptSchema,
  PaymentSchema,
  type MarkPaid,
  type Payment,
  type PaymentAttempt,
  type PaymentMethod,
} from "@bar/contracts";
import { apiGet, apiPost } from "./client";

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
