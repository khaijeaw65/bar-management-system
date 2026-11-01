import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TableAdminService } from './table-admin.service.js';
import type { TableSeatRepository } from '../domain/table-seat.repository.js';
import type { AuditLogService } from '../../../common/audit/audit-log.service.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { SeatAdminRecord } from '../domain/table-seat.types.js';
import { DuplicateSeatLabelError } from '../domain/table-seat.errors.js';

vi.mock('@nestjs-cls/transactional', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs-cls/transactional')>();
  return {
    ...actual,
    Transactional: () => () => undefined,
  };
});

const SEAT_1: SeatAdminRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  label: 'T1',
  kind: 'table',
  sortOrder: 1,
  isActive: true,
  qrToken: 'qr-token-1111111111111111111111111111111111111111111',
  hasLiveVisit: false,
};

const SEAT_2: SeatAdminRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  label: 'T2',
  kind: 'table',
  sortOrder: 2,
  isActive: true,
  qrToken: 'qr-token-2222222222222222222222222222222222222222222',
  hasLiveVisit: false,
};

describe('TableAdminService', () => {
  let service: TableAdminService;
  let repo: {
    listAdmin: ReturnType<typeof vi.fn>;
    findAdminById: ReturnType<typeof vi.fn>;
    findActiveByLabel: ReturnType<typeof vi.fn>;
    getMaxSortOrder: ReturnType<typeof vi.fn>;
    listByKind: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateSortOrders: ReturnType<typeof vi.fn>;
    clearStaffCall: ReturnType<typeof vi.fn>;
    lockForUpdate: ReturnType<typeof vi.fn>;
  };
  let auditLog: { record: ReturnType<typeof vi.fn> };
  let notifications: { emitToStaff: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    repo = {
      listAdmin: vi.fn().mockResolvedValue([SEAT_1, SEAT_2]),
      findAdminById: vi.fn().mockResolvedValue(SEAT_1),
      findActiveByLabel: vi.fn().mockResolvedValue(null),
      getMaxSortOrder: vi.fn().mockResolvedValue(2),
      listByKind: vi.fn().mockResolvedValue([SEAT_1, SEAT_2]),
      create: vi.fn().mockImplementation((input) => Promise.resolve({
        id: '33333333-3333-4333-8333-333333333333',
        ...input,
        isActive: true,
        hasLiveVisit: false,
      })),
      update: vi.fn().mockImplementation((id, patch) => Promise.resolve({
        ...SEAT_1,
        id,
        ...patch,
      })),
      updateSortOrders: vi.fn().mockResolvedValue(undefined),
      clearStaffCall: vi.fn().mockResolvedValue(null),
      lockForUpdate: vi.fn().mockResolvedValue(true),
    };
    auditLog = { record: vi.fn().mockResolvedValue(undefined) };
    notifications = { emitToStaff: vi.fn() };

    service = new TableAdminService(
      repo as unknown as TableSeatRepository,
      auditLog as unknown as AuditLogService,
      notifications as unknown as NotificationsService,
    );
  });

  describe('listManage', () => {
    it('returns list of admin seats', async () => {
      const result = await service.listManage();
      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.label).toBe('T1');
      expect(result.items[1]?.label).toBe('T2');
    });
  });

  describe('create', () => {
    it('creates seat at end of section and emits tables.changed', async () => {
      const result = await service.create({ label: ' T3 ', kind: 'table' });
      expect(repo.getMaxSortOrder).toHaveBeenCalledWith('table');
      expect(repo.create).toHaveBeenCalledWith({
        label: 'T3',
        kind: 'table',
        sortOrder: 3,
        qrToken: expect.any(String),
      });
      expect(auditLog.record).toHaveBeenCalledWith(expect.objectContaining({
        action: 'CREATE',
        entity: 'table_seat',
      }));
      expect(notifications.emitToStaff).toHaveBeenCalledWith('tables.changed', {
        seatIds: [result.id],
      });
      expect(result.label).toBe('T3');
    });

    it('rejects duplicate active label with 409 SEAT_LABEL_TAKEN', async () => {
      repo.findActiveByLabel.mockResolvedValueOnce(SEAT_1);
      await expect(service.create({ label: 't1', kind: 'table' })).rejects.toMatchObject({
        code: 'SEAT_LABEL_TAKEN',
        status: 409,
      });
    });

    it('translates repository DuplicateSeatLabelError to 409 SEAT_LABEL_TAKEN', async () => {
      repo.create.mockRejectedValueOnce(new DuplicateSeatLabelError());
      await expect(service.create({ label: 'T3', kind: 'table' })).rejects.toMatchObject({
        code: 'SEAT_LABEL_TAKEN',
        status: 409,
      });
    });
  });

  describe('update', () => {
    it('renames seat when valid', async () => {
      const result = await service.update(SEAT_1.id, { label: 'T1-new' });
      expect(repo.update).toHaveBeenCalledWith(SEAT_1.id, { label: 'T1-new' });
      expect(auditLog.record).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE',
      }));
      expect(notifications.emitToStaff).toHaveBeenCalledWith('tables.changed', {
        seatIds: [SEAT_1.id],
      });
      expect(result.id).toBe(SEAT_1.id);
    });

    it('moves seat to end of new section when kind changes', async () => {
      repo.getMaxSortOrder.mockResolvedValueOnce(8);
      await service.update(SEAT_1.id, { kind: 'counter' });
      expect(repo.getMaxSortOrder).toHaveBeenCalledWith('counter');
      expect(repo.update).toHaveBeenCalledWith(SEAT_1.id, { kind: 'counter', sortOrder: 9 });
    });

    it('rejects if new label conflicts with another active seat', async () => {
      repo.findActiveByLabel.mockResolvedValueOnce(SEAT_2);
      await expect(service.update(SEAT_1.id, { label: 'T2' })).rejects.toMatchObject({
        code: 'SEAT_LABEL_TAKEN',
        status: 409,
      });
    });

    it('translates repository DuplicateSeatLabelError on update to 409', async () => {
      repo.update.mockRejectedValueOnce(new DuplicateSeatLabelError());
      await expect(service.update(SEAT_1.id, { label: 'T2' })).rejects.toMatchObject({
        code: 'SEAT_LABEL_TAKEN',
        status: 409,
      });
    });

    it('rejects unknown seat with 404 NOT_FOUND', async () => {
      repo.findAdminById.mockResolvedValueOnce(null);
      await expect(service.update('00000000-0000-4000-8000-000000000000', { label: 'X' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        status: 404,
      });
    });
  });

  describe('reorder', () => {
    it('updates sortOrder 0..n-1 when permutation is complete', async () => {
      const result = await service.reorder({
        kind: 'table',
        ids: [SEAT_2.id, SEAT_1.id],
      });
      expect(repo.updateSortOrders).toHaveBeenCalledWith([
        { id: SEAT_2.id, sortOrder: 0 },
        { id: SEAT_1.id, sortOrder: 1 },
      ]);
      expect(auditLog.record).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE',
        entity: 'table_seat',
      }));
      expect(notifications.emitToStaff).toHaveBeenCalledWith('tables.changed', {
        seatIds: [SEAT_2.id, SEAT_1.id],
      });
      expect(result.items).toHaveLength(2);
    });

    it('rejects missing or extra ids with 400 VALIDATION_ERROR', async () => {
      await expect(service.reorder({
        kind: 'table',
        ids: [SEAT_1.id],
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
      });

      await expect(service.reorder({
        kind: 'table',
        ids: [SEAT_1.id, '99999999-9999-4999-8999-999999999999'],
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    });
  });

  describe('deactivate', () => {
    it('rejects seat with live visit with 409 SEAT_IN_USE', async () => {
      repo.findAdminById.mockResolvedValueOnce({ ...SEAT_1, hasLiveVisit: true });
      await expect(service.deactivate(SEAT_1.id)).rejects.toMatchObject({
        code: 'SEAT_IN_USE',
        status: 409,
      });
    });

    it('deactivates seat and clears bell if ringing', async () => {
      repo.clearStaffCall.mockResolvedValueOnce({ calledAt: new Date(), reason: 'bill', note: null });
      const result = await service.deactivate(SEAT_1.id);
      expect(repo.lockForUpdate).toHaveBeenCalledWith(SEAT_1.id);
      expect(repo.clearStaffCall).toHaveBeenCalledWith(SEAT_1.id);
      expect(repo.update).toHaveBeenCalledWith(SEAT_1.id, { isActive: false });
      expect(notifications.emitToStaff).toHaveBeenCalledWith('table.staff_call_cleared', {
        tableSeatId: SEAT_1.id,
        acknowledgedBy: null,
      });
      expect(notifications.emitToStaff).toHaveBeenCalledWith('tables.changed', {
        seatIds: [SEAT_1.id],
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('activates inactive seat when label is unique', async () => {
      repo.findAdminById.mockResolvedValueOnce({ ...SEAT_1, isActive: false });
      const result = await service.activate(SEAT_1.id);
      expect(repo.update).toHaveBeenCalledWith(SEAT_1.id, { isActive: true });
      expect(notifications.emitToStaff).toHaveBeenCalledWith('tables.changed', {
        seatIds: [SEAT_1.id],
      });
      expect(result.isActive).toBe(true);
    });

    it('rejects activation if another active seat has same label', async () => {
      repo.findAdminById.mockResolvedValueOnce({ ...SEAT_1, isActive: false });
      repo.findActiveByLabel.mockResolvedValueOnce(SEAT_2);
      await expect(service.activate(SEAT_1.id)).rejects.toMatchObject({
        code: 'SEAT_LABEL_TAKEN',
        status: 409,
      });
    });

    it('translates repository DuplicateSeatLabelError on activate to 409', async () => {
      repo.findAdminById.mockResolvedValueOnce({ ...SEAT_1, isActive: false });
      repo.update.mockRejectedValueOnce(new DuplicateSeatLabelError());
      await expect(service.activate(SEAT_1.id)).rejects.toMatchObject({
        code: 'SEAT_LABEL_TAKEN',
        status: 409,
      });
    });
  });
});
