import './set-auth-env.js';
import { PERMISSION_CODES } from '@bar/contracts';
import { DataSource } from 'typeorm';
import { migrations } from '../src/providers/database/migrations.js';
import { DEFAULT_GROUP_IDS } from '../src/modules/iam/domain/default-groups.js';
import { testDatabaseName } from './test-database.js';

describe('IAM seed (e2e)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: testDatabaseName(),
      migrations,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  async function codesOf(groupId: string): Promise<string[]> {
    const rows: Array<{ code: string }> = await dataSource.query(
      `SELECT p.resource || ':' || p.action AS code
         FROM group_policy gp
         JOIN policy_permission pp ON pp.policy_id = gp.policy_id
         JOIN permission p ON p.id = pp.permission_id
        WHERE gp.group_id = $1`,
      [groupId],
    );
    return rows.map((row) => row.code).sort();
  }

  it('AC-1: the catalog is exactly the contracts codes', async () => {
    const rows: Array<{ code: string }> = await dataSource.query(
      `SELECT resource || ':' || action AS code FROM permission`,
    );
    expect(rows.map((row) => row.code).sort()).toEqual([...PERMISSION_CODES].sort());
  });

  it('AC-1: three policies and three groups, one policy each, owner = all, manager = all but two, staff = floor work', async () => {
    const [policies]: Array<{ n: string }> = await dataSource.query(`SELECT COUNT(*) AS n FROM policy`);
    const [groups]: Array<{ n: string }> = await dataSource.query(`SELECT COUNT(*) AS n FROM staff_group`);
    expect(Number(policies?.n)).toBe(3);
    expect(Number(groups?.n)).toBe(3);

    expect(await codesOf(DEFAULT_GROUP_IDS.owner)).toEqual([...PERMISSION_CODES].sort());
    expect(await codesOf(DEFAULT_GROUP_IDS.manager)).toEqual(
      PERMISSION_CODES.filter((code) => code !== 'staff:manage' && code !== 'venue:update_payment').sort(),
    );
    expect(await codesOf(DEFAULT_GROUP_IDS.staff)).toEqual(
      [
        'menu:read', 'menu:toggle_availability', 'orders:read', 'orders:create', 'orders:update_status',
        'tables:read', 'visits:read', 'visits:open', 'visits:close', 'payments:read', 'payments:create', 'venue:read',
      ].sort(),
    );
    const names: Array<{ id: string; name: string }> = await dataSource.query(`SELECT id, name FROM staff_group`);
    expect(Object.fromEntries(names.map((row) => [row.id, row.name]))).toEqual({
      [DEFAULT_GROUP_IDS.owner]: 'เจ้าของ',
      [DEFAULT_GROUP_IDS.manager]: 'ผู้จัดการ',
      [DEFAULT_GROUP_IDS.staff]: 'พนักงาน',
    });
  });

  it('attaches the updated_at trigger to the new tables that have the column (DR-023)', async () => {
    const source = await dataSource.query(`SELECT pg_get_triggerdef(oid) AS def FROM pg_trigger WHERE tgname = 'trg_staff_group_updated_at'`);
    expect(source).toHaveLength(1);
  });
});
