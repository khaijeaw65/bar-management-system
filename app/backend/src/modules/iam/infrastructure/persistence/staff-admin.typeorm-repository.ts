import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { AccessRequestStatus, PermissionCode } from '@bar/contracts';
import { DataSource, EntityManager } from 'typeorm';
import type { MembershipRow } from '../../domain/permission-source.js';
import type { StaffAdminRepository } from '../../domain/staff-admin.repository.js';
import type {
  AccessRequestRow,
  ApproveOutcome,
  DecideOutcome,
  MembershipWrite,
  PermissionSourceRow,
  StaffRow,
  StaffWriteOutcome,
} from '../../domain/staff-admin.types.js';

/** Serialises every IAM write that can change who may manage staff, so two concurrent removals cannot both pass the lockout check. */
const IAM_WRITE_LOCK = 7054001;

interface RequestSql {
  id: string;
  external_id: string;
  provider: 'line' | 'phone_otp';
  display_name: string | null;
  avatar_url: string | null;
  status: AccessRequestStatus;
  requested_at: Date;
  decided_at: Date | null;
}

interface StaffSql {
  id: string;
  display_name: string;
  is_active: boolean;
  avatar_url: string | null;
}

interface MembershipSql {
  user_id: string;
  group_id: string;
  group_name: string;
  valid_from: Date;
  valid_until: Date | null;
}

class LockoutError extends Error {}

const REQUEST_COLUMNS = `id, external_id, provider, display_name, avatar_url, status, requested_at, decided_at`;

@Injectable()
export class StaffAdminTypeormRepository implements StaffAdminRepository {
  public constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async listRequests(status: 'pending' | 'rejected'): Promise<AccessRequestRow[]> {
    const rows: RequestSql[] = await this.dataSource.query(
      `SELECT ${REQUEST_COLUMNS} FROM staff_access_request WHERE status = $1 ORDER BY requested_at DESC`,
      [status],
    );
    return rows.map((row) => this.toRequest(row));
  }

  public approveRequest(
    requestId: string,
    displayName: string,
    memberships: MembershipWrite[],
    decidedBy: string,
    now: Date,
  ): Promise<ApproveOutcome> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [IAM_WRITE_LOCK]);
      const found = await this.lockRequest(manager, requestId);
      if (!found) return { kind: 'not_found' };
      if (found.status !== 'pending') return { kind: 'decided' };
      if (!(await this.allGroupsExist(manager, memberships))) return { kind: 'unknown_group' };
      const userId = await this.createStaff(manager, found, displayName);
      await this.writeMemberships(manager, userId, memberships, now);
      await manager.query(
        `UPDATE staff_access_request SET status = 'approved', decided_at = $2, decided_by = $3 WHERE id = $1`,
        [requestId, now, decidedBy],
      );
      return { kind: 'ok', userId };
    });
  }

  public decideRequest(
    requestId: string,
    from: AccessRequestStatus,
    to: AccessRequestStatus,
    decidedBy: string,
    now: Date,
  ): Promise<DecideOutcome> {
    return this.dataSource.transaction(async (manager) => {
      const found = await this.lockRequest(manager, requestId);
      if (!found) return { kind: 'not_found' };
      if (found.status !== from) return { kind: 'wrong_state' };
      const decidedAt = to === 'pending' ? null : now;
      const by = to === 'pending' ? null : decidedBy;
      // node-postgres via TypeORM answers UPDATE ... RETURNING as [rows, affectedCount].
      const [rows]: [RequestSql[], number] = await manager.query(
        `UPDATE staff_access_request SET status = $2, decided_at = $3, decided_by = $4
          WHERE id = $1 RETURNING ${REQUEST_COLUMNS}`,
        [requestId, to, decidedAt, by],
      );
      return { kind: 'ok', request: this.toRequest(rows[0] as RequestSql) };
    });
  }

  public async listStaff(): Promise<StaffRow[]> {
    const users = await this.staffQuery(this.dataSource.manager, null);
    return this.withMemberships(this.dataSource.manager, users);
  }

  public async findStaff(id: string): Promise<StaffRow | null> {
    const users = await this.staffQuery(this.dataSource.manager, id);
    const [row] = await this.withMemberships(this.dataSource.manager, users);
    return row ?? null;
  }

  public updateStaff(
    id: string,
    patch: { displayName?: string; isActive?: boolean },
    now: Date,
  ): Promise<StaffWriteOutcome> {
    // Only a deactivation can take a manager away; a rename or a reactivation never needs the check.
    return this.guarded(now, patch.isActive === false, async (manager) => {
      if (!(await this.lockUser(manager, id))) return { kind: 'not_found' };
      if (patch.displayName !== undefined) {
        await manager.query(`UPDATE staff_user SET display_name = $2 WHERE id = $1`, [id, patch.displayName]);
      }
      if (patch.isActive !== undefined) {
        await manager.query(`UPDATE staff_user SET is_active = $2 WHERE id = $1`, [id, patch.isActive]);
      }
      return { kind: 'ok' };
    });
  }

  public replaceMemberships(
    id: string,
    memberships: MembershipWrite[],
    now: Date,
  ): Promise<StaffWriteOutcome> {
    return this.guarded(now, true, async (manager) => {
      if (!(await this.lockUser(manager, id))) return { kind: 'not_found' };
      if (!(await this.allGroupsExist(manager, memberships))) return { kind: 'unknown_group' };
      await manager.query(`DELETE FROM user_group_membership WHERE user_id = $1`, [id]);
      await this.writeMemberships(manager, id, memberships, now);
      return { kind: 'ok' };
    });
  }

  public async permissionSources(userId: string, now: Date): Promise<PermissionSourceRow[]> {
    const rows: Array<{ code: PermissionCode; kind: 'group' | 'user'; group_name: string | null; policy_name: string }> =
      await this.dataSource.query(
        `SELECT p.resource || ':' || p.action AS code, 'group' AS kind, g.name AS group_name, pol.name AS policy_name
           FROM user_group_membership m
           JOIN staff_group g ON g.id = m.group_id
           JOIN group_policy gp ON gp.group_id = g.id
           JOIN policy pol ON pol.id = gp.policy_id
           JOIN policy_permission pp ON pp.policy_id = pol.id
           JOIN permission p ON p.id = pp.permission_id
          WHERE m.user_id = $1 AND m.valid_from <= $2 AND (m.valid_until IS NULL OR m.valid_until > $2)
         UNION ALL
         SELECT p.resource || ':' || p.action, 'user', NULL, pol.name
           FROM user_policy up
           JOIN policy pol ON pol.id = up.policy_id
           JOIN policy_permission pp ON pp.policy_id = pol.id
           JOIN permission p ON p.id = pp.permission_id
          WHERE up.user_id = $1
          ORDER BY code, kind, policy_name`,
        [userId, now],
      );
    return rows.map((row) => ({
      code: row.code,
      kind: row.kind,
      groupName: row.group_name,
      policyName: row.policy_name,
    }));
  }

  /** One transaction under the IAM write lock; the lockout check runs after the write is applied and rolls it back. */
  private async guarded(
    now: Date,
    checkLockout: boolean,
    write: (manager: EntityManager) => Promise<StaffWriteOutcome>,
  ): Promise<StaffWriteOutcome> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        await manager.query(`SELECT pg_advisory_xact_lock($1)`, [IAM_WRITE_LOCK]);
        const outcome = await write(manager);
        if (checkLockout && outcome.kind === 'ok' && !(await this.someoneCanManage(manager, now))) throw new LockoutError();
        return outcome;
      });
    } catch (error) {
      if (error instanceof LockoutError) return { kind: 'lockout' };
      throw error;
    }
  }

  /** An active person who holds `staff:manage` through a membership with no end date, or a direct user policy. */
  private async someoneCanManage(manager: EntityManager, now: Date): Promise<boolean> {
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

  private async lockRequest(manager: EntityManager, id: string): Promise<RequestSql | null> {
    const rows: RequestSql[] = await manager.query(
      `SELECT ${REQUEST_COLUMNS} FROM staff_access_request WHERE id = $1 FOR UPDATE`,
      [id],
    );
    return rows[0] ?? null;
  }

  private async lockUser(manager: EntityManager, id: string): Promise<boolean> {
    const rows: unknown[] = await manager.query(`SELECT 1 FROM staff_user WHERE id = $1 FOR UPDATE`, [id]);
    return rows.length > 0;
  }

  private async allGroupsExist(manager: EntityManager, memberships: MembershipWrite[]): Promise<boolean> {
    const ids = memberships.map((membership) => membership.groupId);
    if (ids.length === 0) return true;
    const rows: unknown[] = await manager.query(`SELECT 1 FROM staff_group WHERE id = ANY($1::uuid[])`, [ids]);
    return rows.length === new Set(ids).size;
  }

  private async createStaff(manager: EntityManager, request: RequestSql, displayName: string): Promise<string> {
    const users: Array<{ id: string }> = await manager.query(
      `INSERT INTO staff_user (display_name) VALUES ($1) RETURNING id`,
      [displayName],
    );
    const userId = (users[0] as { id: string }).id;
    await manager.query(
      `INSERT INTO staff_user_identity (user_id, provider, external_id, display_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, request.provider, request.external_id, request.display_name, request.avatar_url],
    );
    return userId;
  }

  private async writeMemberships(
    manager: EntityManager,
    userId: string,
    memberships: MembershipWrite[],
    now: Date,
  ): Promise<void> {
    for (const membership of memberships) {
      await manager.query(
        `INSERT INTO user_group_membership (user_id, group_id, valid_from, valid_until) VALUES ($1, $2, $3, $4)`,
        [userId, membership.groupId, now, membership.validUntil],
      );
    }
  }

  private staffQuery(manager: EntityManager, id: string | null): Promise<StaffSql[]> {
    return manager.query(
      `SELECT u.id, u.display_name, u.is_active, i.avatar_url
         FROM staff_user u
         LEFT JOIN staff_user_identity i ON i.user_id = u.id AND i.provider = 'line'
        WHERE ($1::uuid IS NULL OR u.id = $1)
        ORDER BY u.is_active DESC, u.display_name, u.id`,
      [id],
    );
  }

  private async withMemberships(manager: EntityManager, users: StaffSql[]): Promise<StaffRow[]> {
    if (users.length === 0) return [];
    const rows: MembershipSql[] = await manager.query(
      `SELECT m.user_id, g.id AS group_id, g.name AS group_name, m.valid_from, m.valid_until
         FROM user_group_membership m
         JOIN staff_group g ON g.id = m.group_id
        WHERE m.user_id = ANY($1::uuid[])
        ORDER BY g.name, g.id`,
      [users.map((user) => user.id)],
    );
    const byUser = new Map<string, MembershipRow[]>();
    for (const row of rows) {
      const list = byUser.get(row.user_id) ?? [];
      list.push({
        groupId: row.group_id,
        groupName: row.group_name,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
      });
      byUser.set(row.user_id, list);
    }
    return users.map((user) => ({
      id: user.id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      memberships: byUser.get(user.id) ?? [],
    }));
  }

  private toRequest(row: RequestSql): AccessRequestRow {
    return {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      status: row.status,
      requestedAt: row.requested_at,
      decidedAt: row.decided_at,
    };
  }
}
