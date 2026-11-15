import type { PermissionCode } from '@bar/contracts';
import type {
  GroupRow,
  GroupWriteOutcome,
  MemberCodeRow,
  MemberRow,
  NamedInput,
  PolicyRow,
  PolicyWriteOutcome,
} from './iam-admin.types.js';

/**
 * Owner-side writes on groups, policies and the matrix (BRIEF-055). Every write that can take a permission
 * away runs in one transaction under the shared IAM write lock and re-reads the database for the lockout check.
 */
export abstract class IamAdminRepository {
  public abstract listGroups(): Promise<GroupRow[]>;
  public abstract findGroup(id: string): Promise<GroupRow | null>;
  public abstract createGroup(input: NamedInput, policyIds: string[], actorId: string): Promise<GroupWriteOutcome>;
  public abstract updateGroup(id: string, patch: Partial<NamedInput>, actorId: string): Promise<GroupWriteOutcome>;
  public abstract setGroupPolicies(id: string, policyIds: string[], actorId: string, now: Date): Promise<GroupWriteOutcome>;
  public abstract deleteGroup(id: string, now: Date): Promise<GroupWriteOutcome>;
  public abstract groupMembers(id: string): Promise<MemberRow[]>;
  /** Live codes of the group's members: through this group, or from any other live source. */
  public abstract memberCodes(id: string, now: Date): Promise<MemberCodeRow[]>;

  public abstract listPolicies(now: Date): Promise<PolicyRow[]>;
  public abstract findPolicy(id: string, now: Date): Promise<PolicyRow | null>;
  public abstract createPolicy(input: NamedInput, codes: PermissionCode[], actorId: string): Promise<PolicyWriteOutcome>;
  public abstract updatePolicy(id: string, patch: Partial<NamedInput>, actorId: string): Promise<PolicyWriteOutcome>;
  public abstract setPolicyCodes(id: string, codes: PermissionCode[], actorId: string, now: Date): Promise<PolicyWriteOutcome>;
  public abstract deletePolicy(id: string): Promise<PolicyWriteOutcome>;

  /** Adds catalog codes missing from the permission table and from the all-permissions policy; returns how many links it added. */
  public abstract completeAllPolicy(allPolicyId: string, codes: readonly PermissionCode[]): Promise<number>;
}
