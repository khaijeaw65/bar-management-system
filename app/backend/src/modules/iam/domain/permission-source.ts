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
  /** Active staff user IDs holding code at now via direct policy or active group membership. */
  staffHolding(code: PermissionCode, now: Date): Promise<string[]>;
  /** Any เจ้าของ membership row exists, whatever its dates or the user's state (Field 2026-10-30: fail-open only on a fresh DB). */
  everHadOwner(): Promise<boolean>;
}

export const PERMISSION_SOURCE = Symbol('PERMISSION_SOURCE');
