import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { IssuedSession } from '../src/modules/auth/application/token.types.js';
import { DEFAULT_GROUP_IDS, DEFAULT_POLICY_IDS, GROUP_ID_BY_NAME } from '../src/modules/iam/domain/default-groups.js';
import { TokenService } from '../src/modules/auth/application/token.service.js';

export async function insertStaff(
  dataSource: DataSource,
  displayName: string,
  group: keyof typeof GROUP_ID_BY_NAME | null = 'เจ้าของ',
): Promise<string> {
  const inserted: Array<{ id: string }> = await dataSource.query(
    `INSERT INTO staff_user (display_name) VALUES ($1) RETURNING id`,
    [displayName],
  );
  const id = inserted[0]?.id;
  if (!id) throw new Error('staff insert failed');
  if (group) {
    await dataSource.query(`INSERT INTO user_group_membership (user_id, group_id) VALUES ($1, $2)`, [
      id,
      GROUP_ID_BY_NAME[group],
    ]);
  }
  return id;
}

export function staffSession(
  app: INestApplication,
  staffId: string,
): Promise<IssuedSession> {
  return app.get(TokenService).createSession(staffId);
}

export async function clearStaffAndVenue(dataSource: DataSource): Promise<void> {
  await dataSource.query('DELETE FROM payment_charge_item');
  await dataSource.query('DELETE FROM payment_order');
  await dataSource.query('DELETE FROM payment');
  await dataSource.query('DELETE FROM notification');
  await dataSource.query('DELETE FROM order_item_modifier');
  await dataSource.query('UPDATE order_ticket SET issue_item_id = NULL');
  await dataSource.query('DELETE FROM order_item');
  await dataSource.query('DELETE FROM order_ticket');
  await dataSource.query('DELETE FROM order_record');
  await dataSource.query('DELETE FROM guest_session');
  await dataSource.query('DELETE FROM menu_variant_modifier_group');
  await dataSource.query('DELETE FROM modifier_option');
  await dataSource.query('DELETE FROM modifier_group');
  await dataSource.query('DELETE FROM menu_item_variant');
  await dataSource.query('DELETE FROM menu_item_availability');
  await dataSource.query('DELETE FROM menu_item');
  await dataSource.query('DELETE FROM menu_category');
  await dataSource.query('DELETE FROM venue');
  await dataSource.query('DELETE FROM visit');
  await dataSource.query('DELETE FROM table_seat');
  await dataSource.query('DELETE FROM staff_access_request');
  await dataSource.query('DELETE FROM user_policy');
  await dataSource.query('DELETE FROM user_group_membership');
  await deleteCustomGroupsAndPolicies(dataSource);
  await dataSource.query('DELETE FROM staff_user_identity');
  await dataSource.query('DELETE FROM staff_user');
}

export function httpPort(app: INestApplication): number {
  const address = app.getHttpServer().address() as { port?: number } | null;
  if (!address?.port) throw new Error('app is not listening');
  return address.port;
}

/** BRIEF-055 specs create their own groups and policies; the three seeded ones stay. */
async function deleteCustomGroupsAndPolicies(dataSource: DataSource): Promise<void> {
  const groups = Object.values(DEFAULT_GROUP_IDS);
  const policies = Object.values(DEFAULT_POLICY_IDS);
  await dataSource.query('DELETE FROM group_policy WHERE group_id <> ALL($1::uuid[])', [groups]);
  await dataSource.query('DELETE FROM staff_group WHERE id <> ALL($1::uuid[])', [groups]);
  await dataSource.query('DELETE FROM policy_permission WHERE policy_id <> ALL($1::uuid[])', [policies]);
  await dataSource.query('DELETE FROM policy WHERE id <> ALL($1::uuid[])', [policies]);
  // IAM writes stamp the acting person on the seeded rows too; they must not block deleting that person.
  await dataSource.query('UPDATE staff_group SET created_by = NULL, updated_by = NULL');
  await dataSource.query('UPDATE policy SET created_by = NULL, updated_by = NULL');
}
