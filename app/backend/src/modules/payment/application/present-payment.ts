import type { Payment, PaymentAttempt, PaymentStatusChangedPayload } from '@bar/contracts';
import { money, sumSatang } from '../../../common/money.js';
import type { PaymentRecord } from '../domain/payment.types.js';

export function toPayment(record: PaymentRecord): Payment {
  return {
    id: record.id,
    attemptId: record.attemptId,
    visitId: record.visitId,
    partNo: record.partNo,
    partCount: record.partCount,
    amount: money(record.amount),
    method: record.method,
    status: record.status,
    confirmedVia: record.confirmedVia,
    slipTransRef: record.slipTransRef,
    slipAmount: record.slipAmount === null ? null : money(record.slipAmount),
    statusReason: record.statusReason,
    statusNote: record.statusNote,
    qrPayload: record.qrPayload,
    expiresAt: iso(record.expiresAt),
    paidAt: iso(record.paidAt),
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toAttempt(parts: readonly Payment[]): PaymentAttempt {
  const first = parts[0];
  if (!first) throw new Error('payment attempt has no parts');
  return {
    attemptId: first.attemptId,
    visitId: first.visitId,
    mode: 'merge',
    total: sumSatang(parts.map((part) => part.amount)),
    parts: [...parts],
  };
}

export function groupAttempts(records: readonly PaymentRecord[]): PaymentAttempt[] {
  const groups = new Map<string, Payment[]>();
  for (const record of records) pushPart(groups, toPayment(record));
  return [...groups.values()].map((parts) => toAttempt(parts));
}

export function statusChanged(payment: Payment): PaymentStatusChangedPayload {
  return {
    paymentId: payment.id,
    attemptId: payment.attemptId,
    visitId: payment.visitId,
    status: payment.status,
    confirmedVia: payment.confirmedVia,
    statusReason: payment.statusReason,
    amount: payment.amount,
    partNo: payment.partNo,
    partCount: payment.partCount,
  };
}

function pushPart(groups: Map<string, Payment[]>, payment: Payment): void {
  groups.set(payment.attemptId, [...(groups.get(payment.attemptId) ?? []), payment]);
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}
