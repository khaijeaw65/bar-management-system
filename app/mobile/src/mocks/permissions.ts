import type { MyPermissions, PermissionCode } from '@bar/contracts';

const STAFF_PERMISSIONS: PermissionCode[] = ['orders:read', 'orders:update_status', 'venue:read'];

let permissions: PermissionCode[] = STAFF_PERMISSIONS;

export function setMockPermissions(codes: PermissionCode[]): void {
  permissions = codes;
}

export function resetMockPermissions(): void {
  permissions = STAFF_PERMISSIONS;
}

export function getMockPermissions(): MyPermissions {
  return {
    permissions,
    groups: [{ id: 'f0000001-0000-4000-8000-000000000001', name: 'พนักงาน', validUntil: null }],
  };
}

export async function fetchMockPermissions(): Promise<MyPermissions> {
  return getMockPermissions();
}
