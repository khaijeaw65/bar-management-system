import type { PermissionCode, Policy, StaffGroup, StaffMember } from "@bar/contracts";

const MANAGE: PermissionCode = "staff:manage";

export interface IamWorld {
  member: StaffMember;
  groups: StaffGroup[];
  policies: Policy[];
}

/** What a pending write would change; anything left out stays as the server last said. */
export interface IamChange {
  groups?: StaffGroup[];
  policies?: Policy[];
  personalPolicyIds?: string[];
}

function holdsManage(world: IamWorld, change: IamChange): boolean {
  const groups = change.groups ?? world.groups;
  const policies = change.policies ?? world.policies;
  const personal = change.personalPolicyIds ?? world.member.policyIds;
  const live = new Set(world.member.memberships.filter((row) => row.state === "live").map((row) => row.groupId));
  const attached = new Set([...personal, ...groups.filter((group) => live.has(group.id)).flatMap((group) => group.policyIds)]);
  return policies.some((policy) => attached.has(policy.id) && policy.codes.includes(MANAGE));
}

/** CD-13 D4: true when the person holds staff:manage now and the change would take it away. */
export function losesStaffManage(world: IamWorld, change: IamChange): boolean {
  return holdsManage(world, {}) && !holdsManage(world, change);
}
