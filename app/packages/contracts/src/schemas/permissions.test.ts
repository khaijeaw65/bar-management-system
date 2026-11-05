import { MyPermissionsSchema, PERMISSION_CODES, PermissionCodeSchema } from './permissions.js';

describe('PermissionCodeSchema', () => {
  it('has the 22 catalog codes, all resource:action', () => {
    expect(PERMISSION_CODES).toHaveLength(22);
    for (const code of PERMISSION_CODES) expect(code).toMatch(/^[a-z]+:[a-z_]+$/);
  });

  it('rejects a code outside the catalog', () => {
    expect(PermissionCodeSchema.safeParse('orders:nonexistent').success).toBe(false);
  });
});

describe('MyPermissionsSchema', () => {
  it('accepts a permanent and a time-bound group', () => {
    const parsed = MyPermissionsSchema.parse({
      permissions: ['orders:read'],
      groups: [
        { id: '6f1f3a0e-6b1c-4a52-9a43-0c5b8d1e2f01', name: 'พนักงาน', validUntil: null },
        { id: '6f1f3a0e-6b1c-4a52-9a43-0c5b8d1e2f02', name: 'ผู้จัดการ', validUntil: '2026-11-01T06:00:00.000Z' },
      ],
    });
    expect(parsed.groups).toHaveLength(2);
  });
});
