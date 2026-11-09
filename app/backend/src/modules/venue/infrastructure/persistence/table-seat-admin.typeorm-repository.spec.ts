import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryFailedError } from 'typeorm';
import type { TransactionHost } from '@nestjs-cls/transactional';
import type { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { TableSeatAdminTypeormRepository } from './table-seat-admin.typeorm-repository.js';
import { DuplicateSeatLabelError } from '../../domain/table-seat.errors.js';

describe('TableSeatAdminTypeormRepository', () => {
  let repository: TableSeatAdminTypeormRepository;
  let ormRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    query: ReturnType<typeof vi.fn>;
  };
  let txHost: { tx: { getRepository: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> } };

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
    repository = new TableSeatAdminTypeormRepository(
      txHost as unknown as TransactionHost<TransactionalAdapterTypeOrm>,
    );
  });

  describe('create error translation', () => {
    it('translates 23505 uq_table_seat_label_active into DuplicateSeatLabelError', async () => {
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
      ).rejects.toBeInstanceOf(DuplicateSeatLabelError);
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
    it('translates 23505 uq_table_seat_label_active on update into DuplicateSeatLabelError', async () => {
      ormRepo.findOne.mockResolvedValueOnce({ id: '11111111-1111-4111-8111-111111111111', label: 'T1' });
      const driverError = { code: '23505', constraint: 'uq_table_seat_label_active' };
      const queryError = new QueryFailedError('UPDATE table_seat', [], driverError as unknown as Error);
      ormRepo.save.mockRejectedValueOnce(queryError);

      await expect(
        repository.update('11111111-1111-4111-8111-111111111111', { label: 'T2' }),
      ).rejects.toBeInstanceOf(DuplicateSeatLabelError);
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

  describe('lockForUpdate', () => {
    it('executes SELECT FOR UPDATE on table_seat', async () => {
      txHost.tx.query.mockResolvedValueOnce([{ id: '11111111-1111-4111-8111-111111111111' }]);
      const locked = await repository.lockForUpdate('11111111-1111-4111-8111-111111111111');
      expect(locked).toBe(true);
      expect(txHost.tx.query).toHaveBeenCalledWith(
        'SELECT id FROM table_seat WHERE id = $1 FOR UPDATE',
        ['11111111-1111-4111-8111-111111111111'],
      );
    });
  });
});
