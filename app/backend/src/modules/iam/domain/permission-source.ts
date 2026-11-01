import type { PermissionCode } from '@bar/contracts';
import type { MembershipRow } from './permission-source.types.js';

/** The only reader of the IAM tables for authorisation (BRIEF-053 §6). */
export abstract class PermissionSource {
  public abstract isActiveStaff(userId: string): Promise<boolean>;
  public abstract membershipsOf(userId: string): Promise<MembershipRow[]>;
  /** Codes granted by these groups' policies plus the user's own policies. */
  public abstract codesFor(userId: string, groupIds: string[]): Promise<PermissionCode[]>;
  /** Active staff user IDs holding code at now via direct policy or active group membership. */
  public abstract staffHolding(code: PermissionCode, now: Date): Promise<string[]>;
  /** Any เจ้าของ membership row exists, whatever its dates or the user's state (Field 2026-10-30: fail-open only on a fresh DB). */
  public abstract everHadOwner(): Promise<boolean>;
}
