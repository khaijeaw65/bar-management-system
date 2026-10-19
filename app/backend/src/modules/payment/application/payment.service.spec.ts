import { TransactionHost } from '@nestjs-cls/transactional';
import type { Queue } from 'bullmq';
import type { Clock } from '../../../common/clock.js';
import type { PaymentConfigService } from '../../../providers/config/payment/config.service.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { VenueSettingsService } from '../../venue/application/venue-settings.service.js';
import type { VisitService } from '../../venue/application/visit.service.js';
import type { PaymentRepository } from '../domain/ports/payment.repository.port.js';
import type { PaymentRecord } from '../domain/payment.types.js';
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

  it('ignores a payment that is already settled', async () => {
    const row = pending(at);
    row.status = 'completed';
    const harness = harnessOf(row);
    await harness.service.expire('pay-1');
    expect(harness.repo.row?.status).toBe('completed');
    expect(harness.events).toEqual([]);
  });
});

function harnessOf(row: PaymentRecord): { service: PaymentService; repo: MemoryPayments; events: unknown[] } {
  const repo = new MemoryPayments(row);
  const events: unknown[] = [];
  const notifications = {
    emitToStaff: (_event: string, payload: unknown) => {
      events.push(payload);
    },
  };
  const service = new PaymentService(
    repo,
    new FixedClock(at),
    {} as Queue,
    {} as VisitService,
    {} as BillService,
    {} as VenueSettingsService,
    notifications as NotificationsService,
    { qrTtlSeconds: 900 } as PaymentConfigService,
  );
  return { service, repo, events };
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
    statusReason: null,
    statusNote: null,
    qrPayload: 'payload',
    expiresAt,
    paidAt: null,
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

class MemoryPayments implements PaymentRepository {
  public constructor(public row: PaymentRecord | null) {}

  public async lockById(): Promise<PaymentRecord | null> {
    return this.row ? { ...this.row } : null;
  }

  public async save(payment: PaymentRecord): Promise<PaymentRecord> {
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

  public async listByVisit(): Promise<PaymentRecord[]> {
    return [];
  }

  public async coveredOrderIds(): Promise<string[]> {
    return [];
  }

  public async pendingVisitIds(): Promise<string[]> {
    return [];
  }
}
