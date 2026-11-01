import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DemoLoginRole } from '@bar/contracts';
import { DataSource } from 'typeorm';
import { DEFAULT_GROUP_IDS } from '../../iam/domain/default-groups.js';
import type { DemoRoleTarget } from './auth.types.js';

@Injectable()
export class DemoUserService {
  public constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public async findOrProvision(role: DemoLoginRole): Promise<string> {
    const target = this.demoRoleTarget(role);
    const userId = await this.findOrProvisionUser(target);
    await this.ensureMembership(userId, target.groupId);
    return userId;
  }

  private demoRoleTarget(role: DemoLoginRole): DemoRoleTarget {
    if (role === 'owner') {
      return {
        lineUserId: 'U-demo-owner',
        displayName: 'Demo เจ้าของ',
        groupId: DEFAULT_GROUP_IDS.owner,
      };
    }
    if (role === 'manager') {
      return {
        lineUserId: 'U-demo-manager',
        displayName: 'Demo ผู้จัดการ',
        groupId: DEFAULT_GROUP_IDS.manager,
      };
    }
    return {
      lineUserId: 'U-demo-staff',
      displayName: 'Demo พนักงาน',
      groupId: DEFAULT_GROUP_IDS.staff,
    };
  }

  private async findOrProvisionUser(target: DemoRoleTarget): Promise<string> {
    const existingUserId = await this.findUserId(target.lineUserId);
    if (existingUserId) {
      await this.activateUser(existingUserId);
      return existingUserId;
    }
    return await this.provisionUser(target);
  }

  private async findUserId(lineUserId: string): Promise<string | null> {
    const rows: Array<{ user_id: string }> = await this.dataSource.query(
      `SELECT user_id FROM staff_user_identity WHERE provider = 'line' AND external_id = $1`,
      [lineUserId],
    );
    return rows[0]?.user_id ?? null;
  }

  private async activateUser(userId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE staff_user SET is_active = true WHERE id = $1`,
      [userId],
    );
  }

  private async provisionUser(target: DemoRoleTarget): Promise<string> {
    return await this.dataSource.transaction(async (manager) => {
      const inserted: Array<{ id: string }> = await manager.query(
        `INSERT INTO staff_user (display_name, is_active) VALUES ($1, true) RETURNING id`,
        [target.displayName],
      );
      const id = inserted[0]?.id;
      if (!id) throw new Error('Could not provision demo user');
      await manager.query(
        `INSERT INTO staff_user_identity (user_id, provider, external_id, display_name) VALUES ($1, 'line', $2, $3)`,
        [id, target.lineUserId, target.displayName],
      );
      return id;
    });
  }

  private async ensureMembership(userId: string, groupId: string): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO user_group_membership (user_id, group_id, valid_until) VALUES ($1, $2, NULL)
       ON CONFLICT (user_id, group_id) DO UPDATE SET valid_until = NULL`,
      [userId, groupId],
    );
  }
}
