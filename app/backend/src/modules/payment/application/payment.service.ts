import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Transactional } from '@nestjs-cls/transactional';
import type { Queue } from 'bullmq';
import {
  PAYMENT_STATUS_CHANGED,
  type Payment,
  type PaymentAttempt,
  type PaymentMethod,
} from '@bar/contracts';
import { CLOCK, type Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import { toSatang } from '../../../common/money.js';
import { PaymentConfigService } from '../../../providers/config/payment/config.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import type { VenuePaymentAccount } from '../../venue/domain/venue.repository.js';
import { VisitService } from '../../venue/application/visit.service.js';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../domain/ports/payment.repository.port.js';
import type { NewPayment, PaymentRecord } from '../domain/payment.types.js';
import { BillService } from './bill.service.js';
import type { BillSnapshot, CreatePaymentInput, MarkPaidInput, PaymentExpiryJob } from './payment.types.js';
import { PAYMENT_EXPIRY_QUEUE } from './payment.types.js';
import { promptPayPayload } from './promptpay-payload.js';
import { groupAttempts, statusChanged, toAttempt, toPayment } from './present-payment.js';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  public constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @InjectQueue(PAYMENT_EXPIRY_QUEUE) private readonly expiryQueue: Queue<PaymentExpiryJob>,
    private readonly visits: VisitService,
    private readonly bills: BillService,
    private readonly venues: VenueSettingsService,
    private readonly notifications: NotificationsService,
    private readonly ttl: PaymentConfigService,
  ) {}

  public async create(input: CreatePaymentInput): Promise<PaymentAttempt> {
    const created = await this.insertAttempt(input);
    await this.scheduleExpiry(created);
    this.emitChanged(created);
    return toAttempt([created]);
  }

  public async getById(id: string): Promise<Payment> {
    const payment = await this.payments.findById(id);
    if (!payment) throw new DomainException('NOT_FOUND', 'ไม่พบการชำระเงิน', 404);
    return toPayment(payment);
  }

  public async attemptsFor(visitId: string): Promise<PaymentAttempt[]> {
    return groupAttempts(await this.payments.listByVisit(visitId));
  }

  public async cancel(id: string): Promise<Payment> {
    const payment = await this.cancelPending(id);
    await this.removeExpiry(payment.id);
    this.emitChanged(payment);
    return payment;
  }

  public async markPaid(input: MarkPaidInput): Promise<Payment> {
    const payment = await this.completePending(input);
    await this.removeExpiry(payment.id);
    this.emitChanged(payment);
    return payment;
  }

  public async expire(paymentId: string): Promise<void> {
    const payment = await this.expirePending(paymentId);
    if (!payment) return;
    this.emitChanged(payment);
  }

  @Transactional()
  private async insertAttempt(input: CreatePaymentInput): Promise<Payment> {
    await this.visits.lockLive(input.visitId);
    await this.rejectPending(input.visitId);
    const snapshot = await this.bills.forVisit(input.visitId);
    this.rejectEmpty(snapshot);
    const account = await this.venues.paymentAccount();
    this.rejectMode(account, input.method);
    const saved = await this.payments.insert(this.draft(input, snapshot, account), snapshot.uncoveredOrderIds);
    return toPayment(saved);
  }

  @Transactional()
  private async cancelPending(id: string): Promise<Payment> {
    const locked = await this.requirePending(id);
    locked.status = 'cancelled';
    locked.statusReason = 'staff_cancel';
    return toPayment(await this.payments.save(locked));
  }

  @Transactional()
  private async completePending(input: MarkPaidInput): Promise<Payment> {
    const locked = await this.requirePending(input.paymentId);
    return toPayment(await this.payments.save(this.completed(locked, input)));
  }

  @Transactional()
  private async expirePending(paymentId: string): Promise<Payment | null> {
    const locked = await this.payments.lockById(paymentId);
    if (!locked || locked.status !== 'pending' || !this.isDue(locked)) return null;
    locked.status = 'cancelled';
    locked.statusReason = 'expired';
    return toPayment(await this.payments.save(locked));
  }

  private async requirePending(id: string): Promise<PaymentRecord> {
    const locked = await this.payments.lockById(id);
    if (!locked) throw new DomainException('NOT_FOUND', 'ไม่พบการชำระเงิน', 404);
    if (locked.status !== 'pending') {
      throw new DomainException('INVALID_STATE_TRANSITION', 'สถานะการชำระเงินไม่ถูกต้อง', 409);
    }
    return locked;
  }

  private async rejectPending(visitId: string): Promise<void> {
    const pending = await this.payments.findPendingByVisit(visitId);
    if (!pending) return;
    throw new DomainException('PAYMENT_IN_FLIGHT', 'มีการชำระเงินที่ยังไม่จบ', 409, {
      details: toAttempt([toPayment(pending)]),
    });
  }

  private rejectEmpty(snapshot: BillSnapshot): void {
    if (toSatang(snapshot.bill.remaining) > 0) return;
    throw new DomainException('NOTHING_TO_PAY', 'ไม่มียอดที่ต้องชำระ', 409);
  }

  private rejectMode(account: VenuePaymentAccount, method: PaymentMethod): void {
    if (account.paymentMode === 'gateway') {
      throw new DomainException('PAYMENT_MODE_UNAVAILABLE', 'โหมดการชำระเงินนี้ยังไม่พร้อม', 409);
    }
    if (method === 'promptpay' && !this.hasPromptPay(account)) {
      throw new DomainException('PROMPTPAY_NOT_SET', 'ยังไม่ได้ตั้งพร้อมเพย์', 409);
    }
  }

  private draft(input: CreatePaymentInput, snapshot: BillSnapshot, account: VenuePaymentAccount): NewPayment {
    const promptpay = input.method === 'promptpay';
    const now = this.clock.now();
    return {
      visitId: input.visitId,
      attemptId: randomUUID(),
      partNo: 1,
      partCount: 1,
      amount: snapshot.bill.remaining,
      method: input.method,
      status: promptpay ? 'pending' : 'completed',
      confirmedVia: promptpay ? null : 'cash',
      statusReason: null,
      statusNote: null,
      qrPayload: promptpay ? this.qr(account, snapshot.bill.remaining) : null,
      expiresAt: promptpay ? this.expiresAt(now) : null,
      paidAt: promptpay ? null : now,
    };
  }

  private completed(locked: PaymentRecord, input: MarkPaidInput): PaymentRecord {
    const manual = input.via === 'manual';
    return {
      ...locked,
      status: 'completed',
      confirmedVia: input.via,
      paidAt: this.clock.now(),
      statusReason: manual ? input.reason : null,
      statusNote: manual ? input.note : null,
    };
  }

  private qr(account: VenuePaymentAccount, amount: string): string {
    if (!account.promptpayId || !account.promptpayIdType) {
      throw new DomainException('PROMPTPAY_NOT_SET', 'ยังไม่ได้ตั้งพร้อมเพย์', 409);
    }
    return promptPayPayload(account.promptpayId, account.promptpayIdType, amount);
  }

  private expiresAt(now: Date): Date {
    return new Date(now.getTime() + this.ttl.qrTtlSeconds * 1000);
  }

  private hasPromptPay(account: VenuePaymentAccount): boolean {
    return account.promptpayId !== null && account.promptpayIdType !== null;
  }

  private isDue(payment: PaymentRecord): boolean {
    if (!payment.expiresAt) return false;
    return this.clock.now().getTime() >= payment.expiresAt.getTime();
  }

  private async scheduleExpiry(payment: Payment): Promise<void> {
    if (payment.status !== 'pending' || !payment.expiresAt) return;
    const delay = Math.max(new Date(payment.expiresAt).getTime() - this.clock.now().getTime(), 0);
    try {
      await this.expiryQueue.add('expire', { paymentId: payment.id }, { jobId: payment.id, delay });
    } catch {
      this.logger.error(`expiry enqueue failed ${payment.id}`);
    }
  }

  private async removeExpiry(paymentId: string): Promise<void> {
    try {
      const job = await this.expiryQueue.getJob(paymentId);
      await job?.remove();
    } catch {
      this.logger.error(`expiry remove failed ${paymentId}`);
    }
  }

  private emitChanged(payment: Payment): void {
    this.notifications.emitToStaff(PAYMENT_STATUS_CHANGED, statusChanged(payment));
  }
}
