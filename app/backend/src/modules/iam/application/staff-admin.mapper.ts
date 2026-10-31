import type { AccessRequest, StaffMember, StaffMembership } from '@bar/contracts';
import type { MembershipRow } from '../domain/permission-source.js';
import type { AccessRequestRow, StaffRow } from '../domain/staff-admin.types.js';

export function toAccessRequest(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    status: row.status,
    requestedAt: row.requestedAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
  };
}

export function toStaffMember(row: StaffRow, now: Date): StaffMember {
  return {
    id: row.id,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    isActive: row.isActive,
    memberships: row.memberships.map((membership) => toMembership(membership, now)),
    policyIds: row.policyIds,
  };
}

export function toMembership(row: MembershipRow, now: Date): StaffMembership {
  return {
    groupId: row.groupId,
    groupName: row.groupName,
    validFrom: row.validFrom.toISOString(),
    validUntil: row.validUntil?.toISOString() ?? null,
    state: membershipState(row, now),
  };
}

/** CD-13 D1: live inside [valid_from, valid_until). */
export function membershipState(row: MembershipRow, now: Date): StaffMembership['state'] {
  if (row.validFrom > now) return 'future';
  if (row.validUntil !== null && row.validUntil <= now) return 'expired';
  return 'live';
}
