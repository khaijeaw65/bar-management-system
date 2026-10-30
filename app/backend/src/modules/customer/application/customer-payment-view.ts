import type { CustomerPayment, CustomerPendingPayment } from '@bar/contracts';
import { money } from '../../../common/money.js';
import type { PaymentRecord } from '../../payment/domain/payment.types.js';

/** Built field by field: no staff ids, statusNote, slip data or other sessions' ids reach the phone. */
export function pendingView(record: PaymentRecord, sessionId: string): CustomerPendingPayment {
  return {
    id: record.id,
    amount: money(record.amount),
    qrPayload: record.qrPayload ?? '',
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : record.createdAt.toISOString(),
    mine: record.guestSessionId === sessionId,
    createdAt: record.createdAt.toISOString(),
  };
}

export function emptyPayment(): CustomerPayment {
  return { bill: { total: '0.00', paid: '0.00', remaining: '0.00', locked: false }, pending: null };
}
