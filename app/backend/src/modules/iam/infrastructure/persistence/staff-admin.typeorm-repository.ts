import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { AccessRequestStatus, PermissionCode } from '@bar/contracts';
import { DataSource, EntityManager } from 'typeorm';
import { IamWriteGuard } from './iam-write-guard.js';
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
      await IamWriteGuard.takeLock(manager);
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

  public replacePolicies(id: string, policyIds: string[], now: Date): Promise<StaffWriteOutcome> {
    return this.guarded(now, true, async (manager) => {
      if (!(await this.lockUser(manager, id))) return { kind: 'not_found' };
      const found: unknown[] = await manager.query(`SELECT 1 FROM policy WHERE id = ANY($1::uuid[])`, [policyIds]);
      if (found.length !== policyIds.length) return { kind: 'unknown_policy' };
      await manager.query(`DELETE FROM user_policy WHERE user_id = $1`, [id]);
      for (const policyId of policyIds) {
        await manager.query(`INSERT INTO user_policy (user_id, policy_id) VALUES ($1, $2)`, [id, policyId]);
      }
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

  private guarded(
    now: Date,
    checkLockout: boolean,
    write: (manager: EntityManager) => Promise<StaffWriteOutcome>,
  ): Promise<StaffWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, now, checkLockout, write);
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
    const policies: Array<{ user_id: string; policy_id: string }> = await manager.query(
      `SELECT user_id, policy_id FROM user_policy WHERE user_id = ANY($1::uuid[]) ORDER BY policy_id`,
      [users.map((user) => user.id)],
    );
    const policyIdsByUser = new Map<string, string[]>();
    for (const row of policies) policyIdsByUser.set(row.user_id, [...(policyIdsByUser.get(row.user_id) ?? []), row.policy_id]);
    return users.map((user) => ({
      id: user.id,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      isActive: user.is_active,
      memberships: byUser.get(user.id) ?? [],
      policyIds: policyIdsByUser.get(user.id) ?? [],
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
