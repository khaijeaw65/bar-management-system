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
export interface IamAdminRepository {
  listGroups(): Promise<GroupRow[]>;
  findGroup(id: string): Promise<GroupRow | null>;
  createGroup(input: NamedInput, policyIds: string[], actorId: string): Promise<GroupWriteOutcome>;
  updateGroup(id: string, patch: Partial<NamedInput>, actorId: string): Promise<GroupWriteOutcome>;
  setGroupPolicies(id: string, policyIds: string[], actorId: string, now: Date): Promise<GroupWriteOutcome>;
  deleteGroup(id: string, now: Date): Promise<GroupWriteOutcome>;
  groupMembers(id: string): Promise<MemberRow[]>;
  /** Live codes of the group's members: through this group, or from any other live source. */
  memberCodes(id: string, now: Date): Promise<MemberCodeRow[]>;

  listPolicies(now: Date): Promise<PolicyRow[]>;
  findPolicy(id: string, now: Date): Promise<PolicyRow | null>;
  createPolicy(input: NamedInput, codes: PermissionCode[], actorId: string): Promise<PolicyWriteOutcome>;
  updatePolicy(id: string, patch: Partial<NamedInput>, actorId: string): Promise<PolicyWriteOutcome>;
  setPolicyCodes(id: string, codes: PermissionCode[], actorId: string, now: Date): Promise<PolicyWriteOutcome>;
  deletePolicy(id: string): Promise<PolicyWriteOutcome>;

  /** Adds catalog codes missing from the permission table and from the all-permissions policy; returns how many links it added. */
  completeAllPolicy(allPolicyId: string, codes: readonly PermissionCode[]): Promise<number>;
}

export const IAM_ADMIN_REPOSITORY = Symbol('IAM_ADMIN_REPOSITORY');
