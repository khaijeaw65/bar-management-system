import { AuditLogService } from './audit-log.service.js';

describe('AuditLogService', () => {
  it('inserts one row and stamps changed_by from CLS', async () => {
    const query = vi.fn();
    const service = new AuditLogService(host(query), cls('staff-1'));

    await service.record({
      entity: 'venue',
      entityId: 'venue-1',
      action: 'UPDATE',
      changedFields: {
        promptpay_id: { from: null, to: 'XXX-XXX-5678' },
      },
    });

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO audit_log');
    expect(sql).not.toMatch(/UPDATE|DELETE/i);
    expect(params[0]).toBe('venue');
    expect(params[4]).toBe('staff-1');
    expect(params[3]).toContain('XXX-XXX-5678');
  });

  it('stores a null changed_by when no staff is on the request', async () => {
    const query = vi.fn();
    const service = new AuditLogService(host(query), cls(undefined));
    await service.record({
      entity: 'venue',
      entityId: 'venue-1',
      action: 'UPDATE',
      changedFields: null,
    });
    const params = query.mock.calls[0]?.[1] as unknown[];
    expect(params[4]).toBeNull();
  });
});

function host(query: ReturnType<typeof vi.fn>): never {
  return { tx: { query } } as never;
}

function cls(userId: string | undefined): never {
  return { get: () => userId } as never;
}
