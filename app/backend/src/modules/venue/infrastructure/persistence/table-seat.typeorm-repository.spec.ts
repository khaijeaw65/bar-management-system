import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryFailedError, type Repository } from 'typeorm';
import type { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import type { ClsService } from 'nestjs-cls';
import { TableSeatTypeormRepository } from './table-seat.typeorm-repository.js';
import type { TableSeat } from './table-seat.entity.js';
import { DuplicateSeatLabelException } from '../../domain/table-seat.types.js';

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
      ormRepo as unknown as Repository<TableSeat>,
      txHost as unknown as TransactionHost<TransactionalAdapterTypeOrm>,
      cls as unknown as ClsService,
    );
  });

  describe('create error translation', () => {
    it('translates 23505 uq_table_seat_label_active into DuplicateSeatLabelException', async () => {
      const driverError = { code: '23505', constraint: 'uq_table_seat_label_active' };
      const queryError = new QueryFailedError('INSERT INTO table_seat', [], driverError as unknown as Error);
      ormRepo.save.mockRejectedValueOnce(queryError);

      await expect(
        repository.create({
          label: 'T1',
          kind: 'table',
          sortOrder: 0,
          qrToken: 'qr-tok',
        }),
      ).rejects.toBeInstanceOf(DuplicateSeatLabelException);
    });

    it('rethrows other query errors unchanged', async () => {
      const otherError = new Error('database connection lost');
      ormRepo.save.mockRejectedValueOnce(otherError);

      await expect(
        repository.create({
          label: 'T1',
          kind: 'table',
          sortOrder: 0,
          qrToken: 'qr-tok',
        }),
      ).rejects.toThrow('database connection lost');
    });
  });

  describe('update error translation', () => {
    it('translates 23505 uq_table_seat_label_active on update into DuplicateSeatLabelException', async () => {
      ormRepo.findOne.mockResolvedValueOnce({ id: '11111111-1111-4111-8111-111111111111', label: 'T1' });
      const driverError = { code: '23505', constraint: 'uq_table_seat_label_active' };
      const queryError = new QueryFailedError('UPDATE table_seat', [], driverError as unknown as Error);
      ormRepo.save.mockRejectedValueOnce(queryError);

      await expect(
        repository.update('11111111-1111-4111-8111-111111111111', { label: 'T2' }),
      ).rejects.toBeInstanceOf(DuplicateSeatLabelException);
    });
  });

  describe('updateSortOrders', () => {
    it('loads all seats with In, updates sortOrder, and saves entities together', async () => {
      const seatA = { id: '11111111-1111-4111-8111-111111111111', sortOrder: 0 };
      const seatB = { id: '22222222-2222-4222-8222-222222222222', sortOrder: 1 };
      ormRepo.find.mockResolvedValueOnce([seatA, seatB]);

      await repository.updateSortOrders([
        { id: seatB.id, sortOrder: 0 },
        { id: seatA.id, sortOrder: 1 },
      ]);

      expect(ormRepo.find).toHaveBeenCalled();
      expect(seatA.sortOrder).toBe(1);
      expect(seatB.sortOrder).toBe(0);
      expect(ormRepo.save).toHaveBeenCalledWith([seatA, seatB]);
    });

    it('throws when seat count does not match input length', async () => {
      ormRepo.find.mockResolvedValueOnce([{ id: '11111111-1111-4111-8111-111111111111' }]);

      await expect(
        repository.updateSortOrders([
          { id: '11111111-1111-4111-8111-111111111111', sortOrder: 0 },
          { id: '22222222-2222-4222-8222-222222222222', sortOrder: 1 },
        ]),
      ).rejects.toThrow('Expected 2 seats to reorder, found 1');
    });
  });

  describe('lockForUpdate and lockActiveForShare', () => {
    it('executes SELECT FOR UPDATE on table_seat', async () => {
      txHost.tx.query.mockResolvedValueOnce([{ id: '11111111-1111-4111-8111-111111111111' }]);
      const locked = await repository.lockForUpdate('11111111-1111-4111-8111-111111111111');
      expect(locked).toBe(true);
      expect(txHost.tx.query).toHaveBeenCalledWith(
        'SELECT id FROM table_seat WHERE id = $1 FOR UPDATE',
        ['11111111-1111-4111-8111-111111111111'],
      );
    });

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
        'SELECT id, label, kind, sort_order FROM table_seat WHERE id = $1 AND is_active = true FOR SHARE',
        ['11111111-1111-4111-8111-111111111111'],
      );
    });
  });
});
