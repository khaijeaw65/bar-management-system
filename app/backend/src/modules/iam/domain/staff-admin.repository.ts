import type { AccessRequestStatus } from '@bar/contracts';
import type {
  AccessRequestRow,
  ApproveOutcome,
  DecideOutcome,
  MembershipWrite,
  PermissionSourceRow,
  StaffRow,
  StaffWriteOutcome,
} from './staff-admin.types.js';

/**
 * Owner-side writes on people and their access. Every write that can remove a manager runs in one
 * transaction that re-reads the database after applying it (never the Redis cache) and refuses with
 * `lockout` when nobody would be left holding `staff:manage` for good (BRIEF-054 lockout rule).
 */
export interface StaffAdminRepository {
  listRequests(status: 'pending' | 'rejected'): Promise<AccessRequestRow[]>;
  approveRequest(
    requestId: string,
    displayName: string,
    memberships: MembershipWrite[],
    decidedBy: string,
    now: Date,
  ): Promise<ApproveOutcome>;
  /** Moves a request from `from` to `to`; `to = pending` clears the decision. */
  decideRequest(
    requestId: string,
    from: AccessRequestStatus,
    to: AccessRequestStatus,
    decidedBy: string,
    now: Date,
  ): Promise<DecideOutcome>;
  listStaff(): Promise<StaffRow[]>;
  findStaff(id: string): Promise<StaffRow | null>;
  updateStaff(
    id: string,
    patch: { displayName?: string; isActive?: boolean },
    now: Date,
  ): Promise<StaffWriteOutcome>;
  replaceMemberships(
    id: string,
    memberships: MembershipWrite[],
    now: Date,
  ): Promise<StaffWriteOutcome>;
  /** Replaces the person's direct (user) policies. */
  replacePolicies(id: string, policyIds: string[], now: Date): Promise<StaffWriteOutcome>;
  permissionSources(userId: string, now: Date): Promise<PermissionSourceRow[]>;
}

export const STAFF_ADMIN_REPOSITORY = Symbol('STAFF_ADMIN_REPOSITORY');
