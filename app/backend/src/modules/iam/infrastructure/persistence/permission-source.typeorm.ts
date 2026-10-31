import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { PermissionCode } from '@bar/contracts';
import { DataSource } from 'typeorm';
import { DEFAULT_GROUP_IDS } from '../../domain/default-groups.js';
import type { MembershipRow, PermissionSource } from '../../domain/permission-source.js';

interface MembershipSql {
  group_id: string;
  group_name: string;
  valid_from: Date;
  valid_until: Date | null;
}

@Injectable()
export class PermissionSourceTypeorm implements PermissionSource {
  public constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async isActiveStaff(userId: string): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM staff_user WHERE id = $1 AND is_active`,
      [userId],
    );
    return rows.length > 0;
  }

  public async membershipsOf(userId: string): Promise<MembershipRow[]> {
    const rows: MembershipSql[] = await this.dataSource.query(
      `SELECT g.id AS group_id, g.name AS group_name, m.valid_from, m.valid_until
         FROM user_group_membership m
         JOIN staff_group g ON g.id = m.group_id
        WHERE m.user_id = $1`,
      [userId],
    );
    return rows.map((row) => ({
      groupId: row.group_id,
      groupName: row.group_name,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
    }));
  }

  public async codesFor(userId: string, groupIds: string[]): Promise<PermissionCode[]> {
    const rows: Array<{ code: PermissionCode }> = await this.dataSource.query(
      `SELECT DISTINCT p.resource || ':' || p.action AS code
         FROM permission p
         JOIN policy_permission pp ON pp.permission_id = p.id
        WHERE pp.policy_id IN (
                SELECT policy_id FROM group_policy WHERE group_id = ANY($2::uuid[])
                UNION
                SELECT policy_id FROM user_policy WHERE user_id = $1
              )`,
      [userId, groupIds],
    );
    return rows.map((row) => row.code);
  }

  public async staffHolding(code: PermissionCode, now: Date): Promise<string[]> {
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT DISTINCT u.id
         FROM staff_user u
        WHERE u.is_active = TRUE
          AND (
            EXISTS (
              SELECT 1
                FROM user_policy up
                JOIN policy_permission pp ON pp.policy_id = up.policy_id
                JOIN permission p ON p.id = pp.permission_id
               WHERE up.user_id = u.id
                 AND (p.resource || ':' || p.action) = $1
            )
            OR EXISTS (
              SELECT 1
                FROM user_group_membership ugm
                JOIN group_policy gp ON gp.group_id = ugm.group_id
                JOIN policy_permission pp ON pp.policy_id = gp.policy_id
                JOIN permission p ON p.id = pp.permission_id
               WHERE ugm.user_id = u.id
                 AND ugm.valid_from <= $2
                 AND (ugm.valid_until IS NULL OR ugm.valid_until > $2)
                 AND (p.resource || ':' || p.action) = $1
            )
          )
        ORDER BY u.id`,
      [code, now],
    );
    return rows.map((row) => row.id);
  }

  public async everHadOwner(): Promise<boolean> {
    const rows: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM user_group_membership WHERE group_id = $1 LIMIT 1`,
      [DEFAULT_GROUP_IDS.owner],
    );
    return rows.length > 0;
  }
}
