import type { DataSource, EntityManager } from 'typeorm';
import { LockoutError, Refused } from './iam-write-guard.errors.js';

/** Serialises every IAM write that can change who may manage staff, so two concurrent removals cannot both pass the lockout check. */
const IAM_WRITE_LOCK = 7054001;

/** The BRIEF-054 lockout rule, shared by every IAM write (staff, groups, policies). */
export class IamWriteGuard {
  /**
   * One transaction under the IAM write lock. A write that answers anything but `ok` is rolled back whole; the lockout
   * check reads the database after the write is applied and rolls it back when nobody would be left to manage staff.
   */
  public static async run<T extends { kind: string }>(
    dataSource: DataSource,
    now: Date,
    checkLockout: boolean,
    write: (manager: EntityManager) => Promise<T>,
  ): Promise<T | { kind: 'lockout' }> {
    try {
      return await dataSource.transaction(async (manager) => {
        await IamWriteGuard.takeLock(manager);
        const outcome = await write(manager);
        if (outcome.kind !== 'ok') throw new Refused(outcome);
        if (checkLockout && !(await IamWriteGuard.someoneCanManage(manager, now))) throw new LockoutError();
        return outcome;
      });
    } catch (error) {
      if (error instanceof LockoutError) return { kind: 'lockout' };
      if (error instanceof Refused) return error.outcome as T;
      throw error;
    }
  }

  public static async takeLock(manager: EntityManager): Promise<void> {
    await manager.query(`SELECT pg_advisory_xact_lock($1)`, [IAM_WRITE_LOCK]);
  }

  /** An active person who holds `staff:manage` through a membership with no end date, or a direct user policy. */
  public static async someoneCanManage(manager: EntityManager, now: Date): Promise<boolean> {
    const rows: unknown[] = await manager.query(
      `SELECT 1
         FROM staff_user u
        WHERE u.is_active
          AND (
            EXISTS (
              SELECT 1
                FROM user_group_membership m
                JOIN group_policy gp ON gp.group_id = m.group_id
                JOIN policy_permission pp ON pp.policy_id = gp.policy_id
                JOIN permission p ON p.id = pp.permission_id
               WHERE m.user_id = u.id AND m.valid_until IS NULL AND m.valid_from <= $1
                 AND p.resource = 'staff' AND p.action = 'manage')
            OR EXISTS (
              SELECT 1
                FROM user_policy up
                JOIN policy_permission pp ON pp.policy_id = up.policy_id
                JOIN permission p ON p.id = pp.permission_id
               WHERE up.user_id = u.id AND p.resource = 'staff' AND p.action = 'manage')
          )
        LIMIT 1`,
      [now],
    );
    return rows.length > 0;
  }
}
