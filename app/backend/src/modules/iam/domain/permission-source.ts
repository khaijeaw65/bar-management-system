import type { PermissionCode } from '@bar/contracts';

export interface MembershipRow {
  groupId: string;
  groupName: string;
  validFrom: Date;
  validUntil: Date | null;
}

/** The only reader of the IAM tables for authorisation (BRIEF-053 §6). */
export interface PermissionSource {
  isActiveStaff(userId: string): Promise<boolean>;
  membershipsOf(userId: string): Promise<MembershipRow[]>;
  /** Codes granted by these groups' policies plus the user's own policies. */
  codesFor(userId: string, groupIds: string[]): Promise<PermissionCode[]>;
  /** An active staff member with a live เจ้าของ membership at `now`. */
  hasLiveOwner(now: Date): Promise<boolean>;
}

export const PERMISSION_SOURCE = Symbol('PERMISSION_SOURCE');
