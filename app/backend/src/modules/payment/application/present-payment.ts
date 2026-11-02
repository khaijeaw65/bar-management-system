import type {
  Payment,
  PaymentAttempt,
  PaymentStatusChangedPayload,
  TodayPaymentItem,
  TodayPaymentsResponse,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { fromSatang, money, sumSatang, toSatang } from '../../../common/money.js';
import type { SlipVerifyResult } from '../domain/ports/slip-verifier.port.js';
import type { PaymentRecord, TodayPaymentRecord } from '../domain/payment.types.js';
import type { MarkPaidInput } from './payment.types.js';

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

export function verifiedRecord(
  locked: PaymentRecord,
  result: Extract<SlipVerifyResult, { kind: 'verified' }>,
  paidAt: Date,
): PaymentRecord {
  return {
    ...locked,
    status: 'completed',
    confirmedVia: 'slip_verify',
    slipTransRef: result.transRef,
    slipAmount: result.amount,
    paidAt,
    statusReason: null,
    statusNote: null,
  };
}

export function completedRecord(locked: PaymentRecord, input: MarkPaidInput, paidAt: Date): PaymentRecord {
  const manual = input.via === 'manual';
  return {
    ...locked,
    status: 'completed',
    confirmedVia: input.via,
    paidAt,
    statusReason: manual ? input.reason : null,
    statusNote: manual ? input.note : null,
  };
}

export function providerRejection(result: Exclude<SlipVerifyResult, { kind: 'verified' }>): DomainException {
  if (result.kind === 'invalid') {
    return new DomainException('SLIP_INVALID', 'อ่านสลิปไม่ได้ — สแกนใหม่หรือถ่ายรูป', 422);
  }
  if (result.kind === 'pending') {
    return new DomainException('SLIP_PENDING', 'สลิปกรุงเทพฯ ยังไม่พร้อม — รอ 5 นาทีแล้วสแกนใหม่', 409);
  }
  return new DomainException('SLIP_SERVICE_UNAVAILABLE', 'ตรวจสลิปไม่ได้ชั่วคราว', 503);
}

function pushPart(groups: Map<string, Payment[]>, payment: Payment): void {
  groups.set(payment.attemptId, [...(groups.get(payment.attemptId) ?? []), payment]);
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function toTodayPaymentItem(record: TodayPaymentRecord): TodayPaymentItem {
  return {
    id: record.id,
    visitId: record.visitId,
    seatLabel: record.seatLabel,
    partNo: record.partNo,
    partCount: record.partCount,
    amount: money(record.amount),
    method: record.method,
    status: record.status,
    confirmedVia: record.confirmedVia,
    slipTransRef: record.slipTransRef,
    statusReason: record.statusReason,
    paidAt: iso(record.paidAt),
    createdAt: record.createdAt.toISOString(),
  };
}

export function summarizeTodayPayments(
  businessDate: string,
  records: readonly TodayPaymentRecord[],
): TodayPaymentsResponse {
  let totalRevenueSatang = 0;
  let promptpayTotalSatang = 0;
  let cashTotalSatang = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;

  for (const item of records) {
    if (item.status === 'completed') {
      completedCount += 1;
      const satang = toSatang(item.amount);
      totalRevenueSatang += satang;
      if (item.method === 'promptpay') promptpayTotalSatang += satang;
      if (item.method === 'cash') cashTotalSatang += satang;
      continue;
    }
    if (item.status === 'pending') {
      pendingCount += 1;
      continue;
    }
    if (item.status === 'cancelled') {
      cancelledCount += 1;
    }
  }

  return {
    businessDate,
    summary: {
      totalRevenue: fromSatang(totalRevenueSatang),
      promptpayTotal: fromSatang(promptpayTotalSatang),
      cashTotal: fromSatang(cashTotalSatang),
      completedCount,
      pendingCount,
      cancelledCount,
    },
    items: records.map(toTodayPaymentItem),
  };
}
