import './set-auth-env.js';
import { DataSource } from 'typeorm';
import { parseOwners, seedRoster, seedStaffMember } from '../src/cli/seed-iam.js';
import { DEFAULT_GROUP_IDS } from '../src/modules/iam/domain/default-groups.js';
import { migrations } from '../src/providers/database/migrations.js';
import { clearStaffAndVenue } from './staff-session.js';
import { testDatabaseName } from './test-database.js';

describe('IAM seed CLIs (e2e)', () => {
  let dataSource: DataSource;
  let bumps = 0;
  const bump = (): Promise<void> => {
    bumps += 1;
    return Promise.resolve();
  };

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
    await clearStaffAndVenue(dataSource);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    bumps = 0;
  });

  async function membershipsByName(): Promise<Record<string, string[]>> {
    const rows: Array<{ display_name: string; name: string }> = await dataSource.query(
      `SELECT u.display_name, g.name FROM user_group_membership m
         JOIN staff_user u ON u.id = m.user_id JOIN staff_group g ON g.id = m.group_id`,
    );
    const result: Record<string, string[]> = {};
    for (const row of rows) (result[row.display_name] ??= []).push(row.name);
    return result;
  }

  it('parses DEV_OWNER_LINE_SUBS', () => {
    expect(parseOwners('U1:Field, U2:Metee ,')).toEqual([
      { lineUserId: 'U1', name: 'Field', group: 'เจ้าของ' },
      { lineUserId: 'U2', name: 'Metee', group: 'เจ้าของ' },
    ]);
    expect(parseOwners(undefined)).toEqual([]);
  });

  it('AC-10: seed:staff is idempotent — one user, one identity, one membership, and bumps the version', async () => {
    const input = { lineUserId: 'U-one', name: 'หนึ่ง', group: 'ผู้จัดการ' };
    const first = await seedStaffMember(dataSource, input, bump);
    const second = await seedStaffMember(dataSource, input, bump);
    expect(second).toBe(first);
    expect(await membershipsByName()).toEqual({ หนึ่ง: ['ผู้จัดการ'] });
    const [identities]: Array<{ n: string }> = await dataSource.query(`SELECT COUNT(*) AS n FROM staff_user_identity`);
    expect(Number(identities?.n)).toBe(1);
    expect(bumps).toBe(2);
  });

  it('seed:staff rejects an unknown group and creates nothing', async () => {
    await expect(seedStaffMember(dataSource, { lineUserId: 'U-x', name: 'x', group: 'แขก' }, bump)).rejects.toThrow('unknown group');
    expect(await membershipsByName()).toEqual({});
  });

  it('AC-10: seed:roster puts both owners in เจ้าของ plus the two demo users, and is idempotent', async () => {
    await seedRoster(dataSource, 'U1:Field,U2:Metee', bump);
    await seedRoster(dataSource, 'U1:Field,U2:Metee', bump);
    expect(await membershipsByName()).toEqual({
      Field: ['เจ้าของ'],
      Metee: ['เจ้าของ'],
      'Demo ผู้จัดการ': ['ผู้จัดการ'],
      'Demo พนักงาน': ['พนักงาน'],
    });
    const [users]: Array<{ n: string }> = await dataSource.query(`SELECT COUNT(*) AS n FROM staff_user`);
    expect(Number(users?.n)).toBe(4);
    const owners: Array<{ n: string }> = await dataSource.query(
      `SELECT COUNT(*) AS n FROM user_group_membership WHERE group_id = $1`,
      [DEFAULT_GROUP_IDS.owner],
    );
    expect(Number(owners[0]?.n)).toBe(2);
  });

  it('seed:staff makes a time-bound membership permanent when re-run', async () => {
    const id = await seedStaffMember(dataSource, { lineUserId: 'U-t', name: 'ชั่วคราว', group: 'พนักงาน' }, bump);
    await dataSource.query(`UPDATE user_group_membership SET valid_until = NOW() - interval '1 day' WHERE user_id = $1`, [id]);
    await seedStaffMember(dataSource, { lineUserId: 'U-t', name: 'ชั่วคราว', group: 'พนักงาน' }, bump);
    const rows: Array<{ valid_until: Date | null }> = await dataSource.query(
      `SELECT valid_until FROM user_group_membership WHERE user_id = $1`,
      [id],
    );
    expect(rows).toEqual([{ valid_until: null }]);
  });
});
