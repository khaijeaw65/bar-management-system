import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PERMISSION_CODES } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { IamAdminService } from '../src/modules/iam/application/iam-admin.service.js';
import { IAM_VERSION_KEY } from '../src/modules/iam/application/iam-version.service.js';
import { DEFAULT_GROUP_IDS, DEFAULT_POLICY_IDS } from '../src/modules/iam/domain/default-groups.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const CASHIER_CODES = ['payments:read', 'payments:create', 'payments:mark_paid'];

const bearer = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

describe('IAM groups & policies API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let redis: RedisService;
  let owner: string;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    redis = app.get(RedisService);
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await redis.client.flushdb();
    owner = await insertStaff(dataSource, 'เจ้าของ A', 'เจ้าของ');
    ownerToken = await tokenOf(owner);
  });

  async function tokenOf(staffId: string): Promise<string> {
    return (await staffSession(app, staffId)).accessToken;
  }

  const api = (token = ownerToken) => ({
    get: (path: string) => request(app.getHttpServer()).get(`/api${path}`).set(bearer(token)),
    post: (path: string, body: object = {}) => request(app.getHttpServer()).post(`/api${path}`).set(bearer(token)).send(body),
    patch: (path: string, body: object) => request(app.getHttpServer()).patch(`/api${path}`).set(bearer(token)).send(body),
    put: (path: string, body: object) => request(app.getHttpServer()).put(`/api${path}`).set(bearer(token)).send(body),
    delete: (path: string) => request(app.getHttpServer()).delete(`/api${path}`).set(bearer(token)),
  });

  /** An unknown payment id: 404 means the guard let the call through, 403 means payments:mark_paid is missing. */
  async function markPaidStatus(token: string): Promise<number> {
    return (await api(token).post(`/payments/${UNKNOWN}/mark-paid`, { via: 'cash' })).status;
  }

  const iamVersion = async (): Promise<number> => Number((await redis.client.get(IAM_VERSION_KEY)) ?? 0);

  async function createPolicy(name: string, codes: string[]): Promise<string> {
    return (await api().post('/policies', { name, codes }).expect(201)).body.data.id;
  }

  async function createGroup(name: string, policyIds: string[]): Promise<string> {
    return (await api().post('/staff-groups', { name, policyIds }).expect(201)).body.data.id;
  }

  async function join(staffId: string, groupId: string): Promise<void> {
    await dataSource.query(`INSERT INTO user_group_membership (user_id, group_id) VALUES ($1, $2)`, [staffId, groupId]);
  }

  it('AC-1: a custom policy and group give a พนักงาน the payment right on the next request', async () => {
    const cashier = await insertStaff(dataSource, 'แคช', 'พนักงาน');
    const cashierToken = await tokenOf(cashier);
    expect(await markPaidStatus(cashierToken)).toBe(403);

    const before = await iamVersion();
    const policyId = await createPolicy('รับเงิน', CASHIER_CODES);
    const groupId = await createGroup('แคชเชียร์', [DEFAULT_POLICY_IDS.staff, policyId]);
    expect(await iamVersion()).toBeGreaterThan(before);
    await api().put(`/staff/${cashier}/memberships`, { memberships: [{ groupId, until: 'permanent' }] }).expect(200);

    expect(await markPaidStatus(cashierToken)).toBe(404);
    const policies = (await api().get('/policies').expect(200)).body.data;
    const created = policies.find((policy: { id: string }) => policy.id === policyId);
    expect(created).toMatchObject({ name: 'รับเงิน', system: null, usage: { groups: 1, users: 0, people: 1 } });
    expect(created.codes).toEqual([...CASHIER_CODES].sort());

    const groups = (await api().get('/staff-groups').expect(200)).body.data;
    expect(groups.slice(0, 3).map((group: { system: string }) => group.system)).toEqual(['owner', 'manager', 'staff']);
    expect(groups.find((group: { id: string }) => group.id === groupId)).toMatchObject({
      system: null,
      memberCount: 1,
    });
  });

  it('AC-2: a personal policy gives one person the right, effective-permissions shows kind user, removing it takes it back', async () => {
    const helper = await insertStaff(dataSource, 'ผู้ช่วย', 'พนักงาน');
    const helperToken = await tokenOf(helper);
    const policyId = await createPolicy('รับเงิน', CASHIER_CODES);

    const attached = await api().put(`/staff/${helper}/policies`, { policyIds: [policyId] }).expect(200);
    expect(attached.body.data.policyIds).toEqual([policyId]);
    expect(await markPaidStatus(helperToken)).toBe(404);
    const effective = (await api().get(`/staff/${helper}/effective-permissions`).expect(200)).body.data.permissions;
    expect(effective.find((entry: { code: string }) => entry.code === 'payments:mark_paid').sources).toEqual([
      { kind: 'user', policyName: 'รับเงิน' },
    ]);

    await api().put(`/staff/${helper}/policies`, { policyIds: [] }).expect(200);
    expect(await markPaidStatus(helperToken)).toBe(403);
    await api().put(`/staff/${helper}/policies`, { policyIds: [UNKNOWN] }).expect(400);
  });

  it('AC-3: seeded rows refuse every edit with SYSTEM_ROW and stay as they were', async () => {
    const refused = async (res: request.Test): Promise<void> => {
      const done = await res.expect(409);
      expect(done.body.code).toBe('SYSTEM_ROW');
    };
    await refused(api().patch(`/staff-groups/${DEFAULT_GROUP_IDS.owner}`, { name: 'อื่น' }));
    await refused(api().put(`/staff-groups/${DEFAULT_GROUP_IDS.owner}/policies`, { policyIds: [] }));
    await refused(api().delete(`/staff-groups/${DEFAULT_GROUP_IDS.owner}`));
    await refused(api().delete(`/staff-groups/${DEFAULT_GROUP_IDS.manager}`));
    await refused(api().delete(`/staff-groups/${DEFAULT_GROUP_IDS.staff}`));
    await refused(api().patch(`/staff-groups/${DEFAULT_GROUP_IDS.staff}`, { name: 'อื่น' }));
    await refused(api().put(`/policies/${DEFAULT_POLICY_IDS.all}/permissions`, { codes: ['menu:read'] }));
    await refused(api().patch(`/policies/${DEFAULT_POLICY_IDS.all}`, { name: 'อื่น' }));
    await refused(api().delete(`/policies/${DEFAULT_POLICY_IDS.all}`));

    const groups = (await api().get('/staff-groups').expect(200)).body.data;
    expect(groups.map((group: { name: string }) => group.name)).toEqual(['เจ้าของ', 'ผู้จัดการ', 'พนักงาน']);
    const all = (await api().get('/policies').expect(200)).body.data.find(
      (policy: { id: string }) => policy.id === DEFAULT_POLICY_IDS.all,
    );
    expect(all).toMatchObject({ system: 'all' });
    expect(all.codes).toEqual([...PERMISSION_CODES].sort());

    // Allowed on the other seeded rows: description on ผู้จัดการ, attached policies on ผู้จัดการ, matrix of จัดการร้าน.
    await api().patch(`/staff-groups/${DEFAULT_GROUP_IDS.manager}`, { description: 'หัวหน้ากะ' }).expect(200);
    await api().put(`/staff-groups/${DEFAULT_GROUP_IDS.manager}/policies`, { policyIds: [DEFAULT_POLICY_IDS.manager, DEFAULT_POLICY_IDS.staff] }).expect(200);
    await api().put(`/staff-groups/${DEFAULT_GROUP_IDS.manager}/policies`, { policyIds: [DEFAULT_POLICY_IDS.manager] }).expect(200);
    await dataSource.query(`UPDATE staff_group SET description = 'ทุกสิทธิ์ ยกเว้นจัดการพนักงานและเปลี่ยนบัญชีรับเงิน' WHERE id = $1`, [DEFAULT_GROUP_IDS.manager]);
  });

  it('AC-4: delete-impact lists only what each member truly loses; deleting drops the rights on the next request', async () => {
    const policyId = await createPolicy('รับเงิน', CASHIER_CODES);
    const groupId = await createGroup('ทีมบาร์', [policyId]);
    const alsoManager = await insertStaff(dataSource, 'ผจก', 'ผู้จัดการ');
    const onlyStaff = await insertStaff(dataSource, 'พนง', 'พนักงาน');
    await join(alsoManager, groupId);
    await join(onlyStaff, groupId);
    const staffToken = await tokenOf(onlyStaff);
    expect(await markPaidStatus(staffToken)).toBe(404);

    const impact = (await api().get(`/staff-groups/${groupId}/delete-impact`).expect(200)).body.data;
    expect(impact.members).toEqual([
      { staffId: alsoManager, displayName: 'ผจก', losing: [] },
      { staffId: onlyStaff, displayName: 'พนง', losing: ['payments:mark_paid'] },
    ]);

    await api().delete(`/staff-groups/${groupId}`).expect(200);
    const [{ n }]: Array<{ n: string }> = await dataSource.query(
      `SELECT COUNT(*) AS n FROM user_group_membership WHERE group_id = $1`,
      [groupId],
    );
    expect(Number(n)).toBe(0);
    expect(await markPaidStatus(staffToken)).toBe(403);
    await api().get(`/staff-groups/${groupId}/delete-impact`).expect(404);
    await api().delete(`/staff-groups/${groupId}`).expect(404);
  });

  it('AC-5: a policy that is attached cannot be deleted; once detached everywhere it can', async () => {
    const policyId = await createPolicy('รับเงิน', CASHIER_CODES);
    const groupId = await createGroup('แคชเชียร์', [policyId]);
    const helper = await insertStaff(dataSource, 'ผู้ช่วย', 'พนักงาน');
    await api().put(`/staff/${helper}/policies`, { policyIds: [policyId] }).expect(200);

    const blocked = await api().delete(`/policies/${policyId}`).expect(409);
    expect(blocked.body).toMatchObject({
      code: 'POLICY_IN_USE',
      data: { groups: ['แคชเชียร์'], users: ['ผู้ช่วย'] },
    });

    await api().put(`/staff-groups/${groupId}/policies`, { policyIds: [] }).expect(200);
    await api().put(`/staff/${helper}/policies`, { policyIds: [] }).expect(200);
    await api().delete(`/policies/${policyId}`).expect(200);
    await api().delete(`/policies/${policyId}`).expect(404);
  });

  describe('AC-6: lockout', () => {
    let manageGroup: string;
    let managePolicy: string;
    let admin: string;
    let adminToken: string;

    /** The only holder of staff:manage is a custom group — the owner's membership is removed to build the edge case. */
    beforeEach(async () => {
      managePolicy = await createPolicy('จัดการคน', ['staff:manage', 'menu:read']);
      manageGroup = await createGroup('ผู้ดูแล', [managePolicy]);
      admin = await insertStaff(dataSource, 'ผู้ดูแล A', null);
      await join(admin, manageGroup);
      await dataSource.query(`DELETE FROM user_group_membership WHERE user_id = $1`, [owner]);
      adminToken = await tokenOf(admin);
    });

    async function expectLockout(res: request.Test): Promise<void> {
      const done = await res.expect(409);
      expect(done.body).toMatchObject({ code: 'IAM_LOCKOUT', data: { reason: 'last_manager' } });
    }

    it('refuses removing staff:manage from the only policy that gives it, and leaves it in place', async () => {
      await expectLockout(api(adminToken).put(`/policies/${managePolicy}/permissions`, { codes: ['menu:read'] }));
      const policy = (await api(adminToken).get('/policies').expect(200)).body.data.find(
        (row: { id: string }) => row.id === managePolicy,
      );
      expect(policy.codes).toContain('staff:manage');
    });

    it('refuses detaching that policy from the group', async () => {
      await expectLockout(api(adminToken).put(`/staff-groups/${manageGroup}/policies`, { policyIds: [] }));
    });

    it('refuses deleting that group, and keeps its members', async () => {
      await expectLockout(api(adminToken).delete(`/staff-groups/${manageGroup}`));
      const [{ n }]: Array<{ n: string }> = await dataSource.query(
        `SELECT COUNT(*) AS n FROM user_group_membership WHERE group_id = $1`,
        [manageGroup],
      );
      expect(Number(n)).toBe(1);
    });

    it('lets the change through once another permanent holder exists', async () => {
      await join(owner, DEFAULT_GROUP_IDS.owner);
      await api(adminToken).put(`/policies/${managePolicy}/permissions`, { codes: ['menu:read'] }).expect(200);
    });
  });

  it('AC-7: the catalog lists every code once with Thai labels, and ทั้งหมด picks up a code it is missing after a restart', async () => {
    const catalog = (await api().get('/permissions/catalog').expect(200)).body.data;
    const codes = catalog.flatMap((row: { actions: Array<{ code: string }> }) => row.actions.map((action) => action.code));
    expect([...codes].sort()).toEqual([...PERMISSION_CODES].sort());
    expect(catalog[0]).toMatchObject({ resource: 'menu', label: 'เมนู' });

    await dataSource.query(
      `DELETE FROM policy_permission
        WHERE policy_id = $1 AND permission_id = (SELECT id FROM permission WHERE resource = 'orders' AND action = 'read')`,
      [DEFAULT_POLICY_IDS.all],
    );
    const before = await iamVersion();
    await app.get(IamAdminService).onApplicationBootstrap();
    const all = (await api().get('/policies').expect(200)).body.data.find(
      (policy: { id: string }) => policy.id === DEFAULT_POLICY_IDS.all,
    );
    expect(all.codes).toEqual([...PERMISSION_CODES].sort());
    expect(await iamVersion()).toBeGreaterThan(before);
  });

  it('AC-8: duplicate names are refused ignoring case and spaces; an unknown code is a 400', async () => {
    await createPolicy('Bar  Team', ['menu:read']);
    const policy = await api().post('/policies', { name: ' bar team ', codes: [] }).expect(409);
    expect(policy.body.code).toBe('POLICY_NAME_TAKEN');
    await createGroup('แคชเชียร์', []);
    const group = await api().post('/staff-groups', { name: ' แคชเชียร์', policyIds: [] }).expect(409);
    expect(group.body.code).toBe('GROUP_NAME_TAKEN');
    const other = await createGroup('บาร์เทนเดอร์', []);
    expect((await api().patch(`/staff-groups/${other}`, { name: 'แคชเชียร์' }).expect(409)).body.code).toBe('GROUP_NAME_TAKEN');
    await api().patch(`/staff-groups/${other}`, { name: 'บาร์เทนเดอร์ 2', description: 'กะดึก' }).expect(200);

    const codes = await api().post('/policies', { name: 'ผิด', codes: ['orders:comp'] }).expect(400);
    expect(codes.body.code).toBe('VALIDATION_ERROR');
    const policyId = await createPolicy('ถูก', ['menu:read']);
    await api().put(`/policies/${policyId}/permissions`, { codes: ['orders:comp'] }).expect(400);
    await api().post('/staff-groups', { name: 'ใหม่', policyIds: [UNKNOWN] }).expect(400);
    // The refused create left nothing behind.
    const groups = (await api().get('/staff-groups').expect(200)).body.data.map((group: { name: string }) => group.name);
    expect(groups).not.toContain('ใหม่');
  });

  it('AC-9: without staff:manage every route is 403 with missing staff:manage', async () => {
    const staff = await insertStaff(dataSource, 'พนักงาน A', 'พนักงาน');
    const token = await tokenOf(staff);
    const id = DEFAULT_GROUP_IDS.staff;
    const calls: Array<() => request.Test> = [
      () => api(token).get('/permissions/catalog'),
      () => api(token).get('/staff-groups'),
      () => api(token).post('/staff-groups', { name: 'x', policyIds: [] }),
      () => api(token).patch(`/staff-groups/${id}`, { description: 'x' }),
      () => api(token).put(`/staff-groups/${id}/policies`, { policyIds: [] }),
      () => api(token).get(`/staff-groups/${id}/delete-impact`),
      () => api(token).delete(`/staff-groups/${id}`),
      () => api(token).get('/policies'),
      () => api(token).post('/policies', { name: 'x', codes: [] }),
      () => api(token).patch(`/policies/${DEFAULT_POLICY_IDS.staff}`, { description: 'x' }),
      () => api(token).put(`/policies/${DEFAULT_POLICY_IDS.staff}/permissions`, { codes: [] }),
      () => api(token).delete(`/policies/${DEFAULT_POLICY_IDS.staff}`),
      () => api(token).put(`/staff/${staff}/policies`, { policyIds: [] }),
    ];
    for (const call of calls) {
      const res = await call();
      expect(res.status).toBe(403);
      expect(res.body.data).toEqual({ missing: ['staff:manage'] });
    }
  });
});
