import type { Policy, StaffGroup, SystemGroup } from '@bar/contracts';
import { DEFAULT_GROUP_IDS, DEFAULT_POLICY_IDS } from '../domain/default-groups.js';
import type { GroupRow, PolicyRow } from '../domain/iam-admin.types.js';

const SYSTEM_BY_GROUP_ID: Record<string, SystemGroup> = {
  [DEFAULT_GROUP_IDS.owner]: 'owner',
  [DEFAULT_GROUP_IDS.manager]: 'manager',
  [DEFAULT_GROUP_IDS.staff]: 'staff',
};

export const systemGroupOf = (id: string): SystemGroup | null => SYSTEM_BY_GROUP_ID[id] ?? null;

export function toStaffGroup(row: GroupRow): StaffGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    system: systemGroupOf(row.id),
    policyIds: row.policyIds,
    memberCount: row.memberCount,
  };
}

export function toPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    system: row.id === DEFAULT_POLICY_IDS.all ? 'all' : null,
    codes: row.codes,
    usage: row.usage,
  };
}

/** System groups first (เจ้าของ → ผู้จัดการ → พนักงาน), then custom ones in creation order. */
export function systemFirst(groups: StaffGroup[]): StaffGroup[] {
  const rank = (group: StaffGroup): number =>
    group.system === null ? 3 : ['owner', 'manager', 'staff'].indexOf(group.system);
  return [...groups].sort((a, b) => rank(a) - rank(b));
}
