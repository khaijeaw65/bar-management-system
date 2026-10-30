import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { PermissionCode } from '@bar/contracts';
import { DataSource, EntityManager } from 'typeorm';
import type { IamAdminRepository } from '../../domain/iam-admin.repository.js';
import type {
  GroupRow,
  GroupWriteOutcome,
  MemberCodeRow,
  MemberRow,
  NamedInput,
  PolicyRow,
  PolicyWriteOutcome,
} from '../../domain/iam-admin.types.js';
import { IamWriteGuard } from './iam-write-guard.js';

const LIVE = `m.valid_from <= $1 AND (m.valid_until IS NULL OR m.valid_until > $1)`;

@Injectable()
export class IamAdminTypeormRepository implements IamAdminRepository {
  public constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public listGroups(): Promise<GroupRow[]> {
    return this.groupRows(this.dataSource.manager, null);
  }

  public async findGroup(id: string): Promise<GroupRow | null> {
    return (await this.groupRows(this.dataSource.manager, id))[0] ?? null;
  }

  public createGroup(input: NamedInput, policyIds: string[], actorId: string): Promise<GroupWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, new Date(), false, async (manager): Promise<GroupWriteOutcome> => {
      if (await this.nameTaken(manager, 'staff_group', input.name, null)) return { kind: 'name_taken' };
      if (!(await this.policiesExist(manager, policyIds))) return { kind: 'unknown_policy' };
      const rows: Array<{ id: string }> = await manager.query(
        `INSERT INTO staff_group (name, description, created_by, updated_by) VALUES ($1, $2, $3, $3) RETURNING id`,
        [input.name, input.description, actorId],
      );
      const id = (rows[0] as { id: string }).id;
      await this.writeGroupPolicies(manager, id, policyIds);
      return { kind: 'ok', id };
    });
  }

  public updateGroup(id: string, patch: Partial<NamedInput>, actorId: string): Promise<GroupWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, new Date(), false, async (manager): Promise<GroupWriteOutcome> => {
      if (!(await this.lockRow(manager, 'staff_group', id))) return { kind: 'not_found' };
      if (patch.name !== undefined && (await this.nameTaken(manager, 'staff_group', patch.name, id))) {
        return { kind: 'name_taken' };
      }
      await manager.query(
        `UPDATE staff_group
            SET name = COALESCE($2, name),
                description = CASE WHEN $3::boolean THEN $4 ELSE description END,
                updated_by = $5
          WHERE id = $1`,
        [id, patch.name ?? null, patch.description !== undefined, patch.description ?? null, actorId],
      );
      return { kind: 'ok', id };
    });
  }

  public setGroupPolicies(id: string, policyIds: string[], actorId: string, now: Date): Promise<GroupWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, now, true, async (manager): Promise<GroupWriteOutcome> => {
      if (!(await this.lockRow(manager, 'staff_group', id))) return { kind: 'not_found' };
      if (!(await this.policiesExist(manager, policyIds))) return { kind: 'unknown_policy' };
      await manager.query(`DELETE FROM group_policy WHERE group_id = $1`, [id]);
      await this.writeGroupPolicies(manager, id, policyIds);
      await manager.query(`UPDATE staff_group SET updated_by = $2 WHERE id = $1`, [id, actorId]);
      return { kind: 'ok', id };
    });
  }

  public deleteGroup(id: string, now: Date): Promise<GroupWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, now, true, async (manager): Promise<GroupWriteOutcome> => {
      if (!(await this.lockRow(manager, 'staff_group', id))) return { kind: 'not_found' };
      await manager.query(`DELETE FROM user_group_membership WHERE group_id = $1`, [id]);
      await manager.query(`DELETE FROM group_policy WHERE group_id = $1`, [id]);
      await manager.query(`DELETE FROM staff_group WHERE id = $1`, [id]);
      return { kind: 'ok', id };
    });
  }

  public async groupMembers(id: string): Promise<MemberRow[]> {
    const rows: Array<{ id: string; display_name: string }> = await this.dataSource.query(
      `SELECT DISTINCT u.id, u.display_name
         FROM user_group_membership m
         JOIN staff_user u ON u.id = m.user_id
        WHERE m.group_id = $1
        ORDER BY u.display_name, u.id`,
      [id],
    );
    return rows.map((row) => ({ staffId: row.id, displayName: row.display_name }));
  }

  public async memberCodes(id: string, now: Date): Promise<MemberCodeRow[]> {
    const rows: Array<{ user_id: string; display_name: string; code: PermissionCode; via: 'group' | 'elsewhere' }> =
      await this.dataSource.query(
        `WITH members AS (SELECT DISTINCT user_id FROM user_group_membership WHERE group_id = $2)
         SELECT u.id AS user_id, u.display_name, p.resource || ':' || p.action AS code,
                CASE WHEN m.group_id = $2 THEN 'group' ELSE 'elsewhere' END AS via
           FROM members
           JOIN staff_user u ON u.id = members.user_id
           JOIN user_group_membership m ON m.user_id = u.id AND ${LIVE}
           JOIN group_policy gp ON gp.group_id = m.group_id
           JOIN policy_permission pp ON pp.policy_id = gp.policy_id
           JOIN permission p ON p.id = pp.permission_id
         UNION ALL
         SELECT u.id, u.display_name, p.resource || ':' || p.action, 'elsewhere'
           FROM members
           JOIN staff_user u ON u.id = members.user_id
           JOIN user_policy up ON up.user_id = u.id
           JOIN policy_permission pp ON pp.policy_id = up.policy_id
           JOIN permission p ON p.id = pp.permission_id`,
        [now, id],
      );
    return rows.map((row) => ({ staffId: row.user_id, displayName: row.display_name, code: row.code, via: row.via }));
  }

  public listPolicies(now: Date): Promise<PolicyRow[]> {
    return this.policyRows(this.dataSource.manager, null, now);
  }

  public async findPolicy(id: string, now: Date): Promise<PolicyRow | null> {
    return (await this.policyRows(this.dataSource.manager, id, now))[0] ?? null;
  }

  public createPolicy(input: NamedInput, codes: PermissionCode[], actorId: string): Promise<PolicyWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, new Date(), false, async (manager): Promise<PolicyWriteOutcome> => {
      if (await this.nameTaken(manager, 'policy', input.name, null)) return { kind: 'name_taken' };
      const rows: Array<{ id: string }> = await manager.query(
        `INSERT INTO policy (name, description, created_by, updated_by) VALUES ($1, $2, $3, $3) RETURNING id`,
        [input.name, input.description, actorId],
      );
      const id = (rows[0] as { id: string }).id;
      return (await this.writeCodes(manager, id, codes)) ? { kind: 'ok', id } : { kind: 'unknown_code' };
    });
  }

  public updatePolicy(id: string, patch: Partial<NamedInput>, actorId: string): Promise<PolicyWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, new Date(), false, async (manager): Promise<PolicyWriteOutcome> => {
      if (!(await this.lockRow(manager, 'policy', id))) return { kind: 'not_found' };
      if (patch.name !== undefined && (await this.nameTaken(manager, 'policy', patch.name, id))) {
        return { kind: 'name_taken' };
      }
      await manager.query(
        `UPDATE policy
            SET name = COALESCE($2, name),
                description = CASE WHEN $3::boolean THEN $4 ELSE description END,
                updated_by = $5
          WHERE id = $1`,
        [id, patch.name ?? null, patch.description !== undefined, patch.description ?? null, actorId],
      );
      return { kind: 'ok', id };
    });
  }

  public setPolicyCodes(id: string, codes: PermissionCode[], actorId: string, now: Date): Promise<PolicyWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, now, true, async (manager): Promise<PolicyWriteOutcome> => {
      if (!(await this.lockRow(manager, 'policy', id))) return { kind: 'not_found' };
      await manager.query(`DELETE FROM policy_permission WHERE policy_id = $1`, [id]);
      if (!(await this.writeCodes(manager, id, codes))) return { kind: 'unknown_code' };
      await manager.query(`UPDATE policy SET updated_by = $2 WHERE id = $1`, [id, actorId]);
      return { kind: 'ok', id };
    });
  }

  public deletePolicy(id: string): Promise<PolicyWriteOutcome> {
    return IamWriteGuard.run(this.dataSource, new Date(), false, async (manager): Promise<PolicyWriteOutcome> => {
      if (!(await this.lockRow(manager, 'policy', id))) return { kind: 'not_found' };
      const groups: Array<{ name: string }> = await manager.query(
        `SELECT g.name FROM group_policy gp JOIN staff_group g ON g.id = gp.group_id WHERE gp.policy_id = $1 ORDER BY g.name`,
        [id],
      );
      const users: Array<{ display_name: string }> = await manager.query(
        `SELECT u.display_name FROM user_policy up JOIN staff_user u ON u.id = up.user_id WHERE up.policy_id = $1 ORDER BY u.display_name`,
        [id],
      );
      if (groups.length > 0 || users.length > 0) {
        return { kind: 'in_use', groups: groups.map((row) => row.name), users: users.map((row) => row.display_name) };
      }
      await manager.query(`DELETE FROM policy_permission WHERE policy_id = $1`, [id]);
      await manager.query(`DELETE FROM policy WHERE id = $1`, [id]);
      return { kind: 'ok', id };
    });
  }

  public async completeAllPolicy(allPolicyId: string, codes: readonly PermissionCode[]): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      await IamWriteGuard.takeLock(manager);
      for (const code of codes) {
        const [resource, action] = code.split(':');
        await manager.query(`INSERT INTO permission (resource, action) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
          resource,
          action,
        ]);
      }
      const added: unknown[] = await manager.query(
        `INSERT INTO policy_permission (policy_id, permission_id)
         SELECT $1, p.id FROM permission p
          WHERE p.resource || ':' || p.action = ANY($2::text[])
         ON CONFLICT DO NOTHING
         RETURNING permission_id`,
        [allPolicyId, [...codes]],
      );
      return added.length;
    });
  }

  private async groupRows(manager: EntityManager, id: string | null): Promise<GroupRow[]> {
    const rows: Array<{
      id: string;
      name: string;
      description: string | null;
      policy_ids: string[];
      member_count: string;
    }> = await manager.query(
      `SELECT g.id, g.name, g.description,
              COALESCE((SELECT array_agg(gp.policy_id ORDER BY gp.policy_id) FROM group_policy gp WHERE gp.group_id = g.id), '{}') AS policy_ids,
              (SELECT COUNT(*) FROM user_group_membership m WHERE m.group_id = g.id) AS member_count
         FROM staff_group g
        WHERE ($1::uuid IS NULL OR g.id = $1)
        ORDER BY g.created_at, g.name, g.id`,
      [id],
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      policyIds: row.policy_ids,
      memberCount: Number(row.member_count),
    }));
  }

  private async policyRows(manager: EntityManager, id: string | null, now: Date): Promise<PolicyRow[]> {
    const rows: Array<{
      id: string;
      name: string;
      description: string | null;
      codes: PermissionCode[];
      groups: string;
      users: string;
      people: string;
    }> = await manager.query(
      `SELECT pol.id, pol.name, pol.description,
              COALESCE((SELECT array_agg(p.resource || ':' || p.action ORDER BY p.resource, p.action)
                          FROM policy_permission pp JOIN permission p ON p.id = pp.permission_id
                         WHERE pp.policy_id = pol.id), '{}') AS codes,
              (SELECT COUNT(*) FROM group_policy gp WHERE gp.policy_id = pol.id) AS groups,
              (SELECT COUNT(*) FROM user_policy up WHERE up.policy_id = pol.id) AS users,
              (SELECT COUNT(*) FROM (
                 SELECT up.user_id FROM user_policy up WHERE up.policy_id = pol.id
                 UNION
                 SELECT m.user_id FROM user_group_membership m
                   JOIN group_policy gp ON gp.group_id = m.group_id
                  WHERE gp.policy_id = pol.id AND (m.valid_until IS NULL OR m.valid_until > $2)
               ) reached) AS people
         FROM policy pol
        WHERE ($1::uuid IS NULL OR pol.id = $1)
        ORDER BY pol.created_at, pol.name, pol.id`,
      [id, now],
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      codes: row.codes,
      usage: { groups: Number(row.groups), users: Number(row.users), people: Number(row.people) },
    }));
  }

  private async nameTaken(manager: EntityManager, table: 'staff_group' | 'policy', name: string, exceptId: string | null): Promise<boolean> {
    // Same name ignoring case and surrounding / repeated spaces.
    const rows: unknown[] = await manager.query(
      `SELECT 1 FROM ${table} t
        WHERE lower(regexp_replace(btrim(t.name), '\\s+', ' ', 'g')) = $1 AND ($2::uuid IS NULL OR t.id <> $2)
        LIMIT 1`,
      [name.trim().replace(/\s+/g, ' ').toLowerCase(), exceptId],
    );
    return rows.length > 0;
  }

  private async lockRow(manager: EntityManager, table: 'staff_group' | 'policy', id: string): Promise<boolean> {
    const rows: unknown[] = await manager.query(`SELECT 1 FROM ${table} WHERE id = $1 FOR UPDATE`, [id]);
    return rows.length > 0;
  }

  private async policiesExist(manager: EntityManager, policyIds: string[]): Promise<boolean> {
    if (policyIds.length === 0) return true;
    const rows: unknown[] = await manager.query(`SELECT 1 FROM policy WHERE id = ANY($1::uuid[])`, [policyIds]);
    return rows.length === policyIds.length;
  }

  private async writeGroupPolicies(manager: EntityManager, groupId: string, policyIds: string[]): Promise<void> {
    for (const policyId of policyIds) {
      await manager.query(`INSERT INTO group_policy (group_id, policy_id) VALUES ($1, $2)`, [groupId, policyId]);
    }
  }

  /** False when a code has no permission row (the startup check keeps the table complete, so this is a stale-client guard). */
  private async writeCodes(manager: EntityManager, policyId: string, codes: PermissionCode[]): Promise<boolean> {
    if (codes.length === 0) return true;
    const rows: unknown[] = await manager.query(
      `INSERT INTO policy_permission (policy_id, permission_id)
       SELECT $1, p.id FROM permission p WHERE p.resource || ':' || p.action = ANY($2::text[])
       RETURNING permission_id`,
      [policyId, codes],
    );
    return rows.length === codes.length;
  }
}
