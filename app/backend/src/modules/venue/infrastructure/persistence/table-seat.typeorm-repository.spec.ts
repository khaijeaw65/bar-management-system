import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { ClsService } from 'nestjs-cls';
import { TableSeatTypeormRepository } from './table-seat.typeorm-repository.js';

describe('TableSeatTypeormRepository', () => {
  let repository: TableSeatTypeormRepository;
  let ormRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
  };
  let txHost: { tx: { getRepository: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> } };
  let cls: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ormRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((val) => ({ id: '11111111-1111-4111-8111-111111111111', ...val })),
      save: vi.fn().mockImplementation((val) => Promise.resolve(val)),
      query: vi.fn(),
    };
    txHost = {
      tx: {
        getRepository: vi.fn().mockReturnValue(ormRepo),
        query: vi.fn(),
      },
    };
    cls = { get: vi.fn().mockReturnValue('user-1') };
    repository = new TableSeatTypeormRepository(
      txHost as unknown as TransactionHost<TransactionalAdapterTypeOrm>,
      cls as unknown as ClsService,
    );
  });

  describe('lockActiveForShare', () => {
    it('executes SELECT FOR SHARE on active table_seat', async () => {
      txHost.tx.query.mockResolvedValueOnce([
        { id: '11111111-1111-4111-8111-111111111111', label: 'T1', kind: 'table', sort_order: 1 },
      ]);
      const seat = await repository.lockActiveForShare('11111111-1111-4111-8111-111111111111');
      expect(seat).toEqual({
        id: '11111111-1111-4111-8111-111111111111',
        label: 'T1',
        kind: 'table',
        sortOrder: 1,
      });
      expect(txHost.tx.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, label, kind, sort_order'),
        ['11111111-1111-4111-8111-111111111111'],
      );
    });

    it('returns null when seat is inactive or not found', async () => {
      txHost.tx.query.mockResolvedValueOnce([]);
      const seat = await repository.lockActiveForShare('11111111-1111-4111-8111-111111111111');
      expect(seat).toBeNull();
    });
  });

  describe('clearStaffCall', () => {
    it('executes clear query and returns call record if cleared', async () => {
      const calledAt = new Date();
      txHost.tx.query.mockResolvedValueOnce([
        { staff_called_at: calledAt, staff_call_reason: 'bill', staff_call_note: 'check please' },
      ]);
      const cleared = await repository.clearStaffCall('11111111-1111-4111-8111-111111111111');
      expect(cleared).toEqual({
        calledAt,
        reason: 'bill',
        note: 'check please',
      });
      expect(txHost.tx.query).toHaveBeenCalledWith(
        expect.stringContaining('WITH previous AS'),
        ['11111111-1111-4111-8111-111111111111', null, 'user-1'],
      );
    });

    it('returns null when no bell was ringing', async () => {
      txHost.tx.query.mockResolvedValueOnce([]);
      const cleared = await repository.clearStaffCall('11111111-1111-4111-8111-111111111111');
      expect(cleared).toBeNull();
    });
  });
});
