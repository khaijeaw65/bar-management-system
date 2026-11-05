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
export abstract class StaffAdminRepository {
  public abstract listRequests(status: 'pending' | 'rejected'): Promise<AccessRequestRow[]>;
  public abstract approveRequest(
    requestId: string,
    displayName: string,
    memberships: MembershipWrite[],
    decidedBy: string,
    now: Date,
  ): Promise<ApproveOutcome>;
  /** Moves a request from `from` to `to`; `to = pending` clears the decision. */
  public abstract decideRequest(
    requestId: string,
    from: AccessRequestStatus,
    to: AccessRequestStatus,
    decidedBy: string,
    now: Date,
  ): Promise<DecideOutcome>;
  public abstract listStaff(): Promise<StaffRow[]>;
  public abstract findStaff(id: string): Promise<StaffRow | null>;
  public abstract updateStaff(
    id: string,
    patch: { displayName?: string; isActive?: boolean },
    now: Date,
  ): Promise<StaffWriteOutcome>;
  public abstract replaceMemberships(
    id: string,
    memberships: MembershipWrite[],
    now: Date,
  ): Promise<StaffWriteOutcome>;
  /** Replaces the person's direct (user) policies. */
  public abstract replacePolicies(id: string, policyIds: string[], now: Date): Promise<StaffWriteOutcome>;
  public abstract permissionSources(userId: string, now: Date): Promise<PermissionSourceRow[]>;
}
