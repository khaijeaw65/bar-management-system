import { TransactionHost } from '@nestjs-cls/transactional';
import { DomainException } from '../../../common/domain-exception.js';
import { StaffUserService } from '../../iam/application/staff-user.service.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import type { TableSeatRepository } from '../domain/table-seat.repository.js';
import type { SeatIdentity, SeatWithLiveVisit } from '../domain/table-seat.types.js';
import type { VisitRepository } from '../domain/visit.repository.js';
import type { VisitRecord } from '../domain/visit.types.js';
import { PaymentGuard } from '../../payment/application/payment-guard.js';
import { VisitService } from './visit.service.js';
import { TABLE_STAFF_CALL_CLEARED, VISIT_OPENED, VISIT_STATE_CHANGED } from '@bar/contracts';

const SEAT: SeatIdentity = {
  id: '11111111-1111-4111-8111-111111111111',
  label: 'C1',
  kind: 'counter',
  sortOrder: 1,
};

function visit(overrides: Partial<VisitRecord> = {}): VisitRecord {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    tableSeatId: SEAT.id,
    state: 'open',
    openedAt: new Date('2026-10-17T12:00:00.000Z'),
    closedAt: null,
    guestLabel: 'พี่เอก',
    openedBy: '33333333-3333-4333-8333-333333333333',
    openedVia: 'pos',
    ...overrides,
  };
}

function seatWith(current: VisitRecord | null): SeatWithLiveVisit {
  return {
    ...SEAT,
    currentVisit: current
      ? {
          id: current.id,
          state: current.state,
          openedAt: current.openedAt,
          guestLabel: current.guestLabel,
        }
      : null,
    staffCall: null,
  };
}

describe('VisitService', () => {
  beforeAll(() => {
    new TransactionHost({
      wrapWithTransaction: async (_options: unknown, fn: () => Promise<unknown>) => fn(),
      getFallbackInstance: () => ({}),
    } as never);
  });

  const visits = {
    insert: vi.fn(),
    findById: vi.fn(),
    findLiveBySeat: vi.fn(),
    closeIfLive: vi.fn(),
    lockById: vi.fn(),
    activateIfWaiting: vi.fn(),
  };
  const seats = {
    listActive: vi.fn(),
    findById: vi.fn(),
    findActiveById: vi.fn(),
    replaceQrToken: vi.fn(),
    clearStaffCall: vi.fn(),
  };
  const staff = { findById: vi.fn() };
  const notifications = { emitToPos: vi.fn(), emitToStaff: vi.fn(), emitTabChanged: vi.fn(), emitSeatVisitOpened: vi.fn() };
  const paymentGuard = { assertNoPaymentInFlight: vi.fn() };
  const service = new VisitService(
    visits as unknown as VisitRepository,
    seats as unknown as TableSeatRepository,
    staff as unknown as StaffUserService,
    notifications as unknown as NotificationsService,
    paymentGuard as unknown as PaymentGuard,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    seats.findById.mockResolvedValue(SEAT);
    seats.findActiveById.mockResolvedValue(SEAT);
    staff.findById.mockResolvedValue({
      id: visit().openedBy,
      displayName: 'Owner',
      isActive: true,
      avatarUrl: null,
    });
  });

  it('emits state_changed only after a live visit is closed', async () => {
    const closed = visit({ state: 'closed', closedAt: new Date() });
    visits.lockById.mockResolvedValue(visit());
    visits.closeIfLive.mockResolvedValue(closed);

    const result = await service.close(closed.id);

    expect(result.state).toBe('closed');
    expect(visits.closeIfLive).toHaveBeenCalledWith(closed.id);
    expect(notifications.emitToPos).toHaveBeenCalledWith(VISIT_STATE_CHANGED, {
      visitId: closed.id,
      tableSeatId: SEAT.id,
      state: 'closed',
    });
  });

  it('clears the seat bell and pings the guests when the visit closes', async () => {
    const closed = visit({ state: 'closed', closedAt: new Date() });
    visits.lockById.mockResolvedValue(visit());
    visits.closeIfLive.mockResolvedValue(closed);
    seats.clearStaffCall.mockResolvedValue(true);

    await service.close(closed.id);

    expect(seats.clearStaffCall).toHaveBeenCalledWith(SEAT.id);
    expect(notifications.emitToStaff).toHaveBeenCalledWith(TABLE_STAFF_CALL_CLEARED, {
      tableSeatId: SEAT.id,
      acknowledgedBy: null,
    });
    expect(notifications.emitTabChanged).toHaveBeenCalledWith(closed.id, true);
  });

  it('stays quiet about the bell when the seat had none', async () => {
    const closed = visit({ state: 'closed', closedAt: new Date() });
    visits.lockById.mockResolvedValue(visit());
    visits.closeIfLive.mockResolvedValue(closed);
    seats.clearStaffCall.mockResolvedValue(false);

    await service.close(closed.id);

    expect(notifications.emitToStaff).not.toHaveBeenCalled();
  });

  it.each(['closed', 'abandoned'] as const)(
    'rejects a %s visit without emitting',
    async (state) => {
      visits.lockById.mockResolvedValue(visit({ state }));
      visits.findById.mockResolvedValue(visit({ state }));

      await expect(service.close(visit().id)).rejects.toMatchObject({
        code: 'INVALID_STATE_TRANSITION',
      });
      expect(notifications.emitToPos).not.toHaveBeenCalled();
    },
  );

  it('reports whether the locked visit is live and does not throw when it is not', async () => {
    visits.lockById.mockResolvedValue(visit());
    await expect(service.lockIfLive(visit().id)).resolves.toBe(true);
    visits.lockById.mockResolvedValue(visit({ state: 'closed' }));
    await expect(service.lockIfLive(visit().id)).resolves.toBe(false);
    visits.lockById.mockResolvedValue(null);
    await expect(service.lockIfLive(visit().id)).resolves.toBe(false);
  });

  it('returns not found when the close matches no visit', async () => {
    visits.lockById.mockResolvedValue(null);
    visits.findById.mockResolvedValue(null);

    await expect(service.close(visit().id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(notifications.emitToPos).not.toHaveBeenCalled();
  });

  it('opens a free seat and emits visit.opened once', async () => {
    const created = visit();
    visits.insert.mockResolvedValue({ kind: 'created', visit: created });
    seats.listActive.mockResolvedValue([seatWith(created)]);

    const result = await service.open({
      tableSeatId: SEAT.id,
      guestLabel: 'พี่เอก',
      via: 'pos',
      staffId: created.openedBy ?? '',
    });

    expect(result.attached).toBe(false);
    expect(result.visit.opener).toEqual({
      staffId: created.openedBy,
      displayName: 'Owner',
    });
    expect(notifications.emitToPos).toHaveBeenCalledWith(
      VISIT_OPENED,
      expect.objectContaining({ id: SEAT.id, label: 'C1' }),
    );
  });

  it('attaches to the live visit and does not emit', async () => {
    const live = visit({ openedVia: 'app' });
    visits.insert.mockResolvedValue({ kind: 'taken' });
    visits.findLiveBySeat.mockResolvedValue(live);

    const result = await service.open({
      tableSeatId: SEAT.id,
      guestLabel: null,
      via: 'pos',
      staffId: '44444444-4444-4444-8444-444444444444',
    });

    expect(result.attached).toBe(true);
    expect(result.visit.openedVia).toBe('app');
    expect(result.visit.opener?.displayName).toBe('Owner');
    expect(notifications.emitToPos).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown seat', async () => {
    seats.findActiveById.mockResolvedValue(null);

    await expect(
      service.open({
        tableSeatId: SEAT.id,
        guestLabel: null,
        via: 'pos',
        staffId: '33333333-3333-4333-8333-333333333333',
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });
});
