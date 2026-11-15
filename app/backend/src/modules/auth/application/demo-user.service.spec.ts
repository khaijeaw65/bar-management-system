import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource, EntityManager } from 'typeorm';
import { DemoUserService } from './demo-user.service.js';
import { DEFAULT_GROUP_IDS } from '../../iam/domain/default-groups.js';

describe('DemoUserService', () => {
  let service: DemoUserService;
  let dataSource: DataSource;
  let queryMock: ReturnType<typeof vi.fn>;
  let transactionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryMock = vi.fn();
    transactionMock = vi.fn();
    dataSource = {
      query: queryMock,
      transaction: transactionMock,
    } as unknown as DataSource;
    service = new DemoUserService(dataSource);
  });

  it('provisions new demo user if not existing for owner', async () => {
    queryMock.mockResolvedValueOnce([]); // find user
    transactionMock.mockImplementationOnce(async (runInTx: (manager: EntityManager) => Promise<string>) => {
      const managerMock = {
        query: vi.fn()
          .mockResolvedValueOnce([{ id: 'new-owner-id' }])
          .mockResolvedValueOnce([]),
      } as unknown as EntityManager;
      return runInTx(managerMock);
    });
    queryMock.mockResolvedValueOnce([]); // membership

    const userId = await service.findOrProvision('owner');

    expect(userId).toBe('new-owner-id');
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('SELECT user_id FROM staff_user_identity'),
      ['U-demo-owner'],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_group_membership'),
      ['new-owner-id', DEFAULT_GROUP_IDS.owner],
    );
  });

  it('reuses existing demo user and activates for manager', async () => {
    queryMock.mockResolvedValueOnce([{ user_id: 'existing-mgr-id' }]); // find user
    queryMock.mockResolvedValueOnce([]); // activate
    queryMock.mockResolvedValueOnce([]); // membership

    const userId = await service.findOrProvision('manager');

    expect(userId).toBe('existing-mgr-id');
    expect(transactionMock).not.toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE staff_user SET is_active = true'),
      ['existing-mgr-id'],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_group_membership'),
      ['existing-mgr-id', DEFAULT_GROUP_IDS.manager],
    );
  });

  it('provisions or finds demo staff with staff group', async () => {
    queryMock.mockResolvedValueOnce([{ user_id: 'existing-staff-id' }]);
    queryMock.mockResolvedValueOnce([]);
    queryMock.mockResolvedValueOnce([]);

    const userId = await service.findOrProvision('staff');

    expect(userId).toBe('existing-staff-id');
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_group_membership'),
      ['existing-staff-id', DEFAULT_GROUP_IDS.staff],
    );
  });
});
