import { Injectable } from '@nestjs/common';
import type {
  CustomerPayment,
  CustomerPendingPayment,
  NotifyTransferResult,
} from '@bar/contracts';
import { DomainException } from '../../../common/domain-exception.js';
import { requestHash } from '../../../common/idempotency/request-hash.js';
import { IdempotencyService } from '../../../common/idempotency/idempotency.service.js';
import { money } from '../../../common/money.js';
import { BillService } from '../../payment/application/bill.service.js';
import { PaymentService } from '../../payment/application/payment.service.js';
import type { PaymentRecord } from '../../payment/domain/payment.types.js';
import { TableSeatService } from '../../venue/application/table-seat.service.js';
import type { GuestSessionView } from '../domain/guest-session.types.js';
import { CustomerThrottle } from './customer-throttle.js';
import { emptyPayment, pendingView } from './customer-payment-view.js';

const NOTIFY_GAP_SECONDS = 60;

/** The phone's way to pay the table. Every write goes through `PaymentService` — one payment writer (BRIEF-052). */
@Injectable()
export class CustomerPaymentService {
  public constructor(
    private readonly payments: PaymentService,
    private readonly bills: BillService,
    private readonly seats: TableSeatService,
    private readonly idempotency: IdempotencyService,
    private readonly throttle: CustomerThrottle,
  ) {}

  public async get(guest: GuestSessionView): Promise<CustomerPayment> {
    if (!guest.visitId) return emptyPayment();
    const snapshot = await this.bills.forVisit(guest.visitId);
    const pending = await this.payments.findPendingRecord(guest.visitId);
    return { bill: snapshot.bill, pending: pending ? pendingView(pending, guest.id) : null };
  }

  public async create(guest: GuestSessionView, key: string | null): Promise<CustomerPendingPayment> {
    const scope = `customer-payment:${guest.id}`;
    const hash = requestHash({});
    const gate = await this.idempotency.begin<CustomerPendingPayment>({ scope, key, hash });
    if (gate.kind === 'replay') return gate.body;
    try {
      const created = await this.write(guest);
      await this.idempotency.finish({ scope, key, hash, body: created });
      return created;
    } catch (error) {
      await this.idempotency.cancel(scope, key);
      throw error;
    }
  }

  public async cancel(guest: GuestSessionView, paymentId: string): Promise<CustomerPayment> {
    const record = await this.ownVisitPayment(guest, paymentId);
    if (record.guestSessionId !== guest.id) {
      throw new DomainException('PAYMENT_NOT_YOURS', 'ยกเลิกได้เฉพาะ QR ที่คุณสร้าง', 403);
    }
    await this.payments.cancel(record.id);
    return this.get(guest);
  }

  public async notifyTransfer(guest: GuestSessionView, paymentId: string): Promise<NotifyTransferResult> {
    const record = await this.ownVisitPayment(guest, paymentId);
    if (record.status !== 'pending' || record.method !== 'promptpay') {
      throw new DomainException('INVALID_STATE_TRANSITION', 'สถานะการชำระเงินไม่ถูกต้อง', 409);
    }
    if (!(await this.throttle.acquire(`customer:transfer:${guest.id}`, NOTIFY_GAP_SECONDS))) {
      throw new DomainException('RATE_LIMITED', 'กรุณารอสักครู่ก่อนแจ้งอีกครั้ง', 429);
    }
    const notifiedAt = await this.seats.callStaff(guest.seat.id, { reason: 'transfer', note: money(record.amount) });
    return { notifiedAt: notifiedAt.toISOString() };
  }

  private async write(guest: GuestSessionView): Promise<CustomerPendingPayment> {
    if (!guest.visitId) throw new DomainException('NOTHING_TO_PAY', 'ไม่มียอดที่ต้องชำระ', 409);
    await this.payments.create({ visitId: guest.visitId, method: 'promptpay', guestSessionId: guest.id });
    const pending = await this.payments.findPendingRecord(guest.visitId);
    if (!pending) throw new DomainException('INVALID_STATE_TRANSITION', 'สถานะการชำระเงินไม่ถูกต้อง', 409);
    return pendingView(pending, guest.id);
  }

  /** A payment on another visit is simply not found. */
  private async ownVisitPayment(guest: GuestSessionView, paymentId: string): Promise<PaymentRecord> {
    const record = guest.visitId ? await this.payments.findRecord(paymentId) : null;
    if (!record || record.visitId !== guest.visitId) throw new DomainException('NOT_FOUND', 'ไม่พบการชำระเงิน', 404);
    return record;
  }
}
