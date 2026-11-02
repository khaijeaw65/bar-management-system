import { TransactionHost } from '@nestjs-cls/transactional';
import type { Queue } from 'bullmq';
import type { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { AuditRecord } from '../../../common/audit/audit-log.types.js';
import type { Clock } from '../../../common/clock.js';
import { DomainException } from '../../../common/domain-exception.js';
import type { PaymentConfigService } from '../../../providers/config/payment/config.service.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { TableSeatService } from '../../venue/application/table-seat.service.js';
import type { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import type { VisitService } from '../../venue/application/visit.service.js';
import type { PaymentRepository } from '../domain/ports/payment.repository.port.js';
import type { SlipVerifier, SlipVerifyResult } from '../domain/ports/slip-verifier.port.js';
import type { PaymentRecord, TodayPaymentRecord } from '../domain/payment.types.js';
import { BillService } from './bill.service.js';
import { PaymentService } from './payment.service.js';

const at = new Date('2026-10-19T12:00:00.000Z');

describe('PaymentService expiry clock', () => {
  beforeAll(() => {
    new TransactionHost({
      wrapWithTransaction: async (_options: unknown, fn: () => Promise<unknown>) => fn(),
      getFallbackInstance: () => ({}),
    } as never);
  });

  it('leaves a pending payment alone before expiresAt and emits nothing', async () => {
    const harness = harnessOf(pending(new Date('2026-10-19T12:15:00.000Z')));
    await harness.service.expire('pay-1');
    expect(harness.repo.row?.status).toBe('pending');
    expect(harness.events).toEqual([]);
  });

  it('cancels a due pending payment once and emits expired', async () => {
    const harness = harnessOf(pending(at));
    await harness.service.expire('pay-1');
    expect(harness.repo.row).toMatchObject({ status: 'cancelled', statusReason: 'expired' });
    expect(harness.events).toHaveLength(1);
    expect(harness.events[0]).toMatchObject({ paymentId: 'pay-1', status: 'cancelled', statusReason: 'expired' });
  });

  it('pings the phones and clears the transfer bell only once the payment leaves pending', async () => {
    const calls: string[] = [];
    const harness = harnessOf(pending(at));
    const wired = new PaymentService(
      harness.repo,
      new FixedClock(at),
      {} as Queue,
      {} as VisitService,
      {} as BillService,
      {} as VenueSettingsService,
      { clearTransferCall: async (id: string) => { calls.push(`clear:${id}`); } } as unknown as TableSeatService,
      { emitToStaff: () => undefined, emitTabChanged: (id: string) => { calls.push(`tab:${id}`); } } as unknown as NotificationsService,
      { qrTtlSeconds: 900 } as PaymentConfigService,
      { verify: async () => ({ kind: 'unavailable' }) },
      { record: async () => undefined } as unknown as AuditLogService,
    );
    await wired.expire('pay-1');
    expect(calls).toEqual(['tab:visit-1', 'clear:visit-1']);
  });

  it('ignores a payment that is already settled', async () => {
    const row = pending(at);
    row.status = 'completed';
    const harness = harnessOf(row);
    await harness.service.expire('pay-1');
    expect(harness.repo.row?.status).toBe('completed');
    expect(harness.events).toEqual([]);
  });
});

describe('PaymentService verifySlip', () => {
  beforeAll(() => {
    new TransactionHost({
      wrapWithTransaction: async (_options: unknown, fn: () => Promise<unknown>) => fn(),
      getFallbackInstance: () => ({}),
    } as never);
  });

  it('completes a matched slip, drops the expiry job, and emits once', async () => {
    const harness = verifyHarness(slipBill());
    harness.slips.next = verified('REF-1', '1305.00', 'matched');
    const payment = await harness.service.verifySlip({ paymentId: 'pay-1', slip: { payload: 'QR' } });
    expect(payment).toMatchObject({
      status: 'completed',
      confirmedVia: 'slip_verify',
      slipAmount: '1305.00',
      slipTransRef: 'REF-1',
    });
    expect(harness.removed).toEqual(['pay-1']);
    expect(harness.events).toHaveLength(1);
    expect(harness.audits).toEqual([]);
  });

  it('rejects a short amount and keeps the payment pending', async () => {
    const harness = verifyHarness(slipBill());
    harness.slips.next = verified('REF-2', '1200.00', 'matched');
    await expect(harness.service.verifySlip({ paymentId: 'pay-1', slip: { payload: 'QR' } })).rejects.toMatchObject({
      code: 'SLIP_AMOUNT_SHORT',
    });
    expect(harness.repo.row?.status).toBe('pending');
    expect(harness.audits[0]?.changedFields).toMatchObject({
      reason: { to: 'SLIP_AMOUNT_SHORT' },
      transRef: { to: 'REF-2' },
      amount: { to: '1200.00' },
    });
  });

  it('maps receiver, invalid, pending, and unavailable without storing names', async () => {
    const cases: Array<{ next: SlipVerifyResult; code: string; status: number }> = [
      { next: verified('REF', '1305.00', 'not_matched'), code: 'SLIP_WRONG_RECEIVER', status: 422 },
      { next: verified('REF', '1305.00', 'unknown'), code: 'SLIP_RECEIVER_UNCLEAR', status: 422 },
      { next: { kind: 'invalid' }, code: 'SLIP_INVALID', status: 422 },
      { next: { kind: 'pending' }, code: 'SLIP_PENDING', status: 409 },
      { next: { kind: 'unavailable' }, code: 'SLIP_SERVICE_UNAVAILABLE', status: 503 },
    ];
    for (const item of cases) {
      const harness = verifyHarness(slipBill());
      harness.slips.next = item.next;
      const error = await harness.service.verifySlip({ paymentId: 'pay-1', slip: { image: 'abc' } }).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(DomainException);
      const rejected = error as DomainException;
      expect(rejected.code).toBe(item.code);
      expect(rejected.getStatus()).toBe(item.status);
      expect(harness.repo.row?.status).toBe('pending');
      expect(JSON.stringify(harness.audits)).not.toMatch(/sender|receiver|นาย/);
    }
  });

  it('does not call the verifier for cash or a payment that is no longer pending', async () => {
    const cash = pending(at);
    cash.method = 'cash';
    const cashHarness = verifyHarness(cash);
    await expect(cashHarness.service.verifySlip({ paymentId: 'pay-1', slip: { payload: 'QR' } })).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(cashHarness.slips.calls).toBe(0);

    const done = pending(at);
    done.status = 'completed';
    const doneHarness = verifyHarness(done);
    await expect(doneHarness.service.verifySlip({ paymentId: 'pay-1', slip: { payload: 'QR' } })).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    expect(doneHarness.slips.calls).toBe(0);
    expect(doneHarness.audits).toEqual([]);
  });

  it('audits a reused slip and leaves this payment pending', async () => {
    const harness = verifyHarness(slipBill());
    harness.slips.next = verified('REF-USED', '1305.00', 'matched');
    harness.repo.failSave = new DomainException('SLIP_ALREADY_USED', 'สลิปนี้ใช้แล้ว', 409);
    await expect(harness.service.verifySlip({ paymentId: 'pay-1', slip: { payload: 'QR' } })).rejects.toMatchObject({
      code: 'SLIP_ALREADY_USED',
    });
    expect(harness.repo.row?.status).toBe('pending');
    expect(harness.audits).toHaveLength(1);
  });
});

function harnessOf(row: PaymentRecord): { service: PaymentService; repo: MemoryPayments; events: unknown[] } {
  const repo = new MemoryPayments(row);
  const events: unknown[] = [];
  const notifications = {
    emitToStaff: (_event: string, payload: unknown) => {
      events.push(payload);
    },
    emitTabChanged: () => undefined,
  };
  const service = new PaymentService(
    repo,
    new FixedClock(at),
    {} as Queue,
    {} as VisitService,
    {} as BillService,
    {} as VenueSettingsService,
    { clearTransferCall: async () => undefined } as unknown as TableSeatService,
    notifications as unknown as NotificationsService,
    { qrTtlSeconds: 900 } as PaymentConfigService,
    { verify: async () => ({ kind: 'unavailable' }) },
    { record: async () => undefined } as unknown as AuditLogService,
  );
  return { service, repo, events };
}

function slipBill(): PaymentRecord {
  return { ...pending(at), amount: '1305.00' };
}

function pending(expiresAt: Date): PaymentRecord {
  return {
    id: 'pay-1',
    attemptId: 'attempt-1',
    visitId: 'visit-1',
    partNo: 1,
    partCount: 1,
    amount: '10.00',
    method: 'promptpay',
    status: 'pending',
    confirmedVia: null,
    slipTransRef: null,
    slipAmount: null,
    statusReason: null,
    statusNote: null,
    qrPayload: 'payload',
    expiresAt,
    paidAt: null,
    guestSessionId: null,
    createdBy: null,
    updatedBy: null,
    createdAt: at,
  };
}

class FixedClock implements Clock {
  public constructor(private readonly at: Date) {}

  public now(): Date {
    return this.at;
  }
}

function verifyHarness(row: PaymentRecord): {
  service: PaymentService;
  repo: MemoryPayments;
  slips: ScriptedSlips;
  events: unknown[];
  audits: AuditRecord[];
  removed: string[];
} {
  const repo = new MemoryPayments(row);
  const slips = new ScriptedSlips();
  const events: unknown[] = [];
  const audits: AuditRecord[] = [];
  const removed: string[] = [];
  const queue = {
    getJob: async (id: string) => ({
      remove: async () => {
        removed.push(id);
      },
    }),
  };
  const service = new PaymentService(
    repo,
    new FixedClock(at),
    queue as unknown as Queue,
    {} as VisitService,
    {} as BillService,
    {} as VenueSettingsService,
    { clearTransferCall: async () => undefined } as unknown as TableSeatService,
    {
      emitToStaff: (_event: string, payload: unknown) => {
        events.push(payload);
      },
      emitTabChanged: () => undefined,
    } as unknown as NotificationsService,
    { qrTtlSeconds: 900 } as PaymentConfigService,
    slips,
    { record: async (input: AuditRecord) => { audits.push(input); } } as unknown as AuditLogService,
  );
  return { service, repo, slips, events, audits, removed };
}

function verified(
  transRef: string,
  amount: string,
  receiverMatch: 'matched' | 'not_matched' | 'unknown',
): SlipVerifyResult {
  return { kind: 'verified', transRef, amount, receiverMatch };
}

class ScriptedSlips implements SlipVerifier {
  public next: SlipVerifyResult = { kind: 'unavailable' };
  public calls = 0;

  public async verify(): Promise<SlipVerifyResult> {
    this.calls += 1;
    return this.next;
  }
}

class MemoryPayments implements PaymentRepository {
  public failSave: Error | null = null;

  public constructor(public row: PaymentRecord | null) {}

  public async lockById(): Promise<PaymentRecord | null> {
    return this.row ? { ...this.row } : null;
  }

  public async save(payment: PaymentRecord): Promise<PaymentRecord> {
    if (this.failSave) throw this.failSave;
    this.row = { ...payment };
    return this.row;
  }

  public async insert(): Promise<PaymentRecord> {
    throw new Error('unused');
  }

  public async findById(): Promise<PaymentRecord | null> {
    return this.row;
  }

  public async findPendingByVisit(): Promise<PaymentRecord | null> {
    return null;
  }

  public async hasPending(): Promise<boolean> {
    return false;
  }

  public async listByVisit(): Promise<PaymentRecord[]> {
    return [];
  }

  public async coveredOrderIds(): Promise<string[]> {
    return [];
  }

  public async pendingVisitIds(): Promise<string[]> {
    return [];
  }

  public todayRows: TodayPaymentRecord[] = [];

  public async findToday(): Promise<TodayPaymentRecord[]> {
    return this.todayRows;
  }
}
