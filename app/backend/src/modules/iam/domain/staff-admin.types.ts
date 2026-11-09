import type { AccessRequestStatus, PermissionCode } from '@bar/contracts';
import type { MembershipRow } from './permission-source.types.js';

export interface AccessRequestRow {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: AccessRequestStatus;
  requestedAt: Date;
  decidedAt: Date | null;
}

export interface StaffRow {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  memberships: MembershipRow[];
  policyIds: string[];
}

/** `validFrom` is always the moment of the write. */
export interface MembershipWrite {
  groupId: string;
  validUntil: Date | null;
}

export interface PermissionSourceRow {
  code: PermissionCode;
  kind: 'group' | 'user';
  groupName: string | null;
  policyName: string;
}

export type ApproveOutcome =
  | { kind: 'ok'; userId: string }
  | { kind: 'not_found' }
  | { kind: 'decided' }
  | { kind: 'unknown_group' };

export type DecideOutcome =
  | { kind: 'ok'; request: AccessRequestRow }
  | { kind: 'not_found' }
  | { kind: 'wrong_state' };

export type StaffWriteOutcome =
  | { kind: 'ok' }
  | { kind: 'not_found' }
  | { kind: 'unknown_group' }
  | { kind: 'unknown_policy' }
  | { kind: 'lockout' };
