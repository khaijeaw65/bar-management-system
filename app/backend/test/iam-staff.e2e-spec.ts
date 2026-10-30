import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { TokenService } from '../src/modules/auth/application/token.service.js';
import {
  LINE_CLIENT,
  buildLineAuthorizeUrl,
  type LineClient,
} from '../src/modules/auth/domain/line-client.js';
import type { LineAuthorizeInput, LineProfile, LineTokenExchange } from '../src/modules/auth/domain/line-client.types.js';
import { IAM_VERSION_KEY } from '../src/modules/iam/application/iam-version.service.js';
import { nextCutoff } from '../src/modules/iam/application/membership-until.js';
import { DEFAULT_GROUP_IDS } from '../src/modules/iam/domain/default-groups.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const FRONTEND = 'http://localhost:3000';
const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const GROUPS = DEFAULT_GROUP_IDS;

class FakeLineClient implements LineClient {
  public profile: LineProfile = { sub: 'U-unset', name: null, picture: null };

  public authorizeUrl(input: LineAuthorizeInput): string {
    return buildLineAuthorizeUrl({
      channelId: process.env.LINE_CHANNEL_ID ?? '',
      callbackUrl: process.env.LINE_CALLBACK_URL ?? '',
      state: input.state,
      nonce: input.nonce,
    });
  }

  public exchangeCode(): Promise<LineTokenExchange> {
    return Promise.resolve({ idToken: 'fake-id-token' });
  }

  public verifyIdToken(): Promise<LineProfile> {
    return Promise.resolve(this.profile);
  }
}

const bearer = (token: string): { Authorization: string } => ({ Authorization: `Bearer ${token}` });

function cookieOf(res: request.Response, name: string): string | undefined {
  const header = res.headers['set-cookie'];
  const lines = Array.isArray(header) ? header : header ? [header] : [];
  return lines.find((line) => line.startsWith(`${name}=`))?.slice(name.length + 1).split(';')[0];
}

function bangkokHour(date: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hourCycle: 'h23' }).format(
      new Date(date),
    ),
  );
}

describe('IAM staff API (e2e)', () => {
  const line = new FakeLineClient();
  let app: INestApplication;
  let dataSource: DataSource;
  let redis: RedisService;
  let owner: string;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LINE_CLIENT)
      .useValue(line)
      .compile();
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
    await seedVenue(dataSource);
    owner = await insertStaff(dataSource, 'เจ้าของ A', 'เจ้าของ');
    ownerToken = (await staffSession(app, owner)).accessToken;
  });

  async function lineLogin(sub: string, name: string): Promise<request.Response> {
    line.profile = { sub, name, picture: null };
    const started = await request(app.getHttpServer()).get('/api/auth/line/login').expect(302);
    const state = new URL(String(started.headers.location)).searchParams.get('state') ?? '';
    return request(app.getHttpServer()).get('/api/auth/line/callback').query({ code: 'auth-code', state }).expect(302);
  }

  async function pendingRequestId(sub: string, name: string): Promise<string> {
    const refused = await lineLogin(sub, name);
    expect(refused.headers.location).toBe(`${FRONTEND}/login?error=not_registered`);
    const rows: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM staff_access_request WHERE external_id = $1`,
      [sub],
    );
    return rows[0]?.id ?? '';
  }

  const api = (token = ownerToken) => ({
    get: (path: string) => request(app.getHttpServer()).get(`/api${path}`).set(bearer(token)),
    post: (path: string, body: object = {}) => request(app.getHttpServer()).post(`/api${path}`).set(bearer(token)).send(body),
    patch: (path: string, body: object) => request(app.getHttpServer()).patch(`/api${path}`).set(bearer(token)).send(body),
    put: (path: string, body: object) => request(app.getHttpServer()).put(`/api${path}`).set(bearer(token)).send(body),
  });

  const approveBody = (until = 'permanent', groupId: string = GROUPS.staff) => ({
    displayName: 'บีม',
    memberships: [{ groupId, until }],
  });

  const iamVersion = async (): Promise<number> => Number((await redis.client.get(IAM_VERSION_KEY)) ?? 0);

  async function approvedStaff(sub = 'U-beam'): Promise<string> {
    const id = await pendingRequestId(sub, 'Beam');
    return (await api().post(`/staff/access-requests/${id}/approve`, approveBody()).expect(201)).body.data.id;
  }

  it('AC-1: a refused LINE login is listed, approving it lets that account in with the พนักงาน set', async () => {
    const requestId = await pendingRequestId('U-beam', 'Beam');
    const listed = (await api().get('/staff/access-requests').expect(200)).body.data;
    expect(listed).toEqual([
      expect.objectContaining({ id: requestId, displayName: 'Beam', status: 'pending', decidedAt: null }),
    ]);

    const approved = await api().post(`/staff/access-requests/${requestId}/approve`, approveBody()).expect(201);
    expect(approved.body.data).toMatchObject({
      displayName: 'บีม',
      isActive: true,
      memberships: [{ groupId: GROUPS.staff, groupName: 'พนักงาน', validUntil: null, state: 'live' }],
    });
    expect((await api().get('/staff/access-requests').expect(200)).body.data).toEqual([]);

    const login = await lineLogin('U-beam', 'Beam');
    expect(login.headers.location).toBe(`${FRONTEND}/`);
    const access = cookieOf(login, 'access_token');
    const me = await request(app.getHttpServer()).get('/api/me/permissions').set('Cookie', `access_token=${access}`).expect(200);
    expect(me.body.data.permissions).toHaveLength(12);
    expect(me.body.data.permissions).not.toContain('payments:mark_paid');

    const again = await api().post(`/staff/access-requests/${requestId}/approve`, approveBody()).expect(409);
    expect(again.body).toMatchObject({ status: 409, code: 'ACCESS_REQUEST_DECIDED' });
    expect(await dataSource.query(`SELECT 1 FROM staff_user WHERE display_name = 'บีม'`)).toHaveLength(1);
  });

  it('AC-1: approve validates the body and the groups', async () => {
    const requestId = await pendingRequestId('U-beam', 'Beam');
    const path = `/staff/access-requests/${requestId}/approve`;
    await api().post(path, { displayName: 'บีม', memberships: [] }).expect(400);
    await api().post(path, { displayName: '  ', memberships: approveBody().memberships }).expect(400);
    await api().post(path, approveBody('permanent', UNKNOWN)).expect(400);
    await api().post(path, { displayName: 'บีม', memberships: [...approveBody().memberships, ...approveBody().memberships] }).expect(400);
    await api().post(`/staff/access-requests/${UNKNOWN}/approve`, approveBody()).expect(404);
    await api().post('/staff/access-requests/not-a-uuid/approve', approveBody()).expect(404);
    expect(await dataSource.query(`SELECT 1 FROM staff_user WHERE display_name = 'บีม'`)).toHaveLength(0);
    expect((await api().get('/staff/access-requests').expect(200)).body.data).toHaveLength(1);
  });

  it('AC-2: reject keeps the account refused and rejected; reopen lists it again', async () => {
    const requestId = await pendingRequestId('U-beam', 'Beam');
    const rejected = await api().post(`/staff/access-requests/${requestId}/reject`).expect(201);
    expect(rejected.body.data).toMatchObject({ id: requestId, status: 'rejected' });
    expect(rejected.body.data.decidedAt).toEqual(expect.any(String));

    const second = await lineLogin('U-beam', 'Beam');
    expect(second.headers.location).toBe(`${FRONTEND}/login?error=not_registered`);
    expect(await dataSource.query(`SELECT status FROM staff_access_request WHERE id = $1`, [requestId])).toEqual([
      { status: 'rejected' },
    ]);
    expect((await api().get('/staff/access-requests').expect(200)).body.data).toEqual([]);
    expect((await api().get('/staff/access-requests?status=rejected').expect(200)).body.data).toHaveLength(1);
    await api().get('/staff/access-requests?status=approved').expect(400);

    await api().post(`/staff/access-requests/${requestId}/reject`).expect(409);
    await api().post(`/staff/access-requests/${requestId}/approve`, approveBody()).expect(409);
    await api().post(`/staff/access-requests/${requestId}/reopen`).expect(201);
    await api().post(`/staff/access-requests/${requestId}/approve`, approveBody()).expect(201);
    await api().post(`/staff/access-requests/${requestId}/reopen`).expect(409);
  });

  it('AC-2: reopen moves rejected back to pending and clears the decision', async () => {
    const requestId = await pendingRequestId('U-beam', 'Beam');
    await api().post(`/staff/access-requests/${requestId}/reject`).expect(201);
    const reopened = await api().post(`/staff/access-requests/${requestId}/reopen`).expect(201);
    expect(reopened.body.data).toMatchObject({ id: requestId, status: 'pending', decidedAt: null });
    expect((await api().get('/staff/access-requests').expect(200)).body.data).toHaveLength(1);
    await api().post(`/staff/access-requests/${requestId}/reopen`).expect(409);
  });

  it('AC-3: end_of_night is the next venue cut-off in Bangkok time, and follows a changed cut-off', async () => {
    const requestId = await pendingRequestId('U-beam', 'Beam');
    const before = new Date();
    const approved = await api().post(`/staff/access-requests/${requestId}/approve`, approveBody('end_of_night')).expect(201);
    const until = approved.body.data.memberships[0].validUntil as string;
    expect(new Date(until).getTime()).toBeGreaterThan(before.getTime());
    expect(new Date(until).getTime() - before.getTime()).toBeLessThanOrEqual(24 * 3600 * 1000);
    expect(bangkokHour(until)).toBe(6);
    expect(new Date(until).toISOString()).toBe(nextCutoff(before, '06:00').toISOString());
    expect(approved.body.data.memberships[0].state).toBe('live');

    await dataSource.query(`UPDATE venue SET business_day_cutoff = '05:00'`);
    const staffId = approved.body.data.id as string;
    const replaced = await api().put(`/staff/${staffId}/memberships`, approveBody('end_of_night')).expect(200);
    expect(bangkokHour(replaced.body.data.memberships[0].validUntil)).toBe(5);

    const past = new Date(Date.now() - 60_000).toISOString();
    const refused = await api().put(`/staff/${staffId}/memberships`, approveBody(past)).expect(400);
    expect(refused.body.code).toBe('VALIDATION_ERROR');
    expect((await api().get(`/staff/${staffId}`).expect(200)).body.data.memberships).toHaveLength(1);
  });

  it('AC-4: a membership that ends drops the permissions on the next request, shows as expired, and PUT removes it', async () => {
    const staffId = await approvedStaff();
    const token = (await staffSession(app, staffId)).accessToken;
    const permissions = async (): Promise<string[]> =>
      (await api(token).get('/me/permissions').expect(200)).body.data.permissions;
    expect(await permissions()).toHaveLength(12);

    const soon = new Date(Date.now() + 1500).toISOString();
    await api().put(`/staff/${staffId}/memberships`, approveBody(soon)).expect(200);
    expect(await permissions()).toHaveLength(12);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    expect(await permissions()).toEqual([]);

    const listed = (await api().get('/staff').expect(200)).body.data as Array<{ id: string; memberships: Array<{ state: string }> }>;
    expect(listed.find((member) => member.id === staffId)?.memberships[0]?.state).toBe('expired');

    const cleared = await api().put(`/staff/${staffId}/memberships`, { memberships: [] }).expect(200);
    expect(cleared.body.data.memberships).toEqual([]);
  });

  it('AC-5: the last permanent manager cannot be removed, end-dated or deactivated; with a second one each works', async () => {
    const temp = await insertStaff(dataSource, 'เจ้าของ ชั่วคราว', null);
    await dataSource.query(
      `INSERT INTO user_group_membership (user_id, group_id, valid_until) VALUES ($1, $2, NOW() + interval '1 day')`,
      [temp, GROUPS.owner],
    );
    const tempToken = (await staffSession(app, temp)).accessToken;
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const ownerMemberships = async (): Promise<number> =>
      (await api().get(`/staff/${owner}`).expect(200)).body.data.memberships.length;

    for (const attempt of [
      () => api().put(`/staff/${owner}/memberships`, { memberships: [] }),
      () => api().put(`/staff/${owner}/memberships`, approveBody(nextWeek, GROUPS.owner)),
      () => api().put(`/staff/${owner}/memberships`, approveBody('permanent', GROUPS.manager)),
      () => api(tempToken).patch(`/staff/${owner}`, { isActive: false }),
    ]) {
      const refused = await attempt().expect(409);
      expect(refused.body).toMatchObject({ status: 409, code: 'IAM_LOCKOUT', data: { reason: 'last_manager' } });
    }
    expect(await ownerMemberships()).toBe(1);
    expect((await api().get(`/staff/${owner}`).expect(200)).body.data).toMatchObject({
      isActive: true,
      memberships: [{ groupId: GROUPS.owner, validUntil: null }],
    });

    const second = await insertStaff(dataSource, 'เจ้าของ B', 'เจ้าของ');
    const secondToken = (await staffSession(app, second)).accessToken;
    await api().put(`/staff/${owner}/memberships`, approveBody(nextWeek, GROUPS.owner)).expect(200);
    await api().put(`/staff/${owner}/memberships`, { memberships: [] }).expect(200);
    await api(secondToken).put(`/staff/${owner}/memberships`, approveBody('permanent', GROUPS.owner)).expect(200);
    await api(tempToken).patch(`/staff/${owner}`, { isActive: false }).expect(200);
  });

  it('AC-5: a direct user policy with staff:manage counts as a way to keep managing', async () => {
    const temp = await insertStaff(dataSource, 'เจ้าของ ชั่วคราว', null);
    await dataSource.query(
      `INSERT INTO user_group_membership (user_id, group_id, valid_until) VALUES ($1, $2, NOW() + interval '1 day')`,
      [temp, GROUPS.owner],
    );
    const policy: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO policy (name) VALUES ('จัดการพนักงาน') RETURNING id`,
    );
    await dataSource.query(
      `INSERT INTO policy_permission (policy_id, permission_id)
       SELECT $1, id FROM permission WHERE resource = 'staff' AND action = 'manage'`,
      [policy[0]?.id],
    );
    await dataSource.query(`INSERT INTO user_policy (user_id, policy_id) VALUES ($1, $2)`, [temp, policy[0]?.id]);
    await api().put(`/staff/${owner}/memberships`, { memberships: [] }).expect(200);
  });

  it('AC-6: nobody deactivates themselves', async () => {
    await insertStaff(dataSource, 'เจ้าของ B', 'เจ้าของ');
    const refused = await api().patch(`/staff/${owner}`, { isActive: false }).expect(409);
    expect(refused.body).toMatchObject({ status: 409, code: 'SELF_DEACTIVATE' });
    expect((await api().get(`/staff/${owner}`).expect(200)).body.data.isActive).toBe(true);
  });

  it('AC-6: deactivating ends web and mobile sessions and refuses LINE login; reactivating restores access', async () => {
    const staffId = await approvedStaff();
    const tokens = app.get(TokenService);
    const web = await tokens.createSession(staffId);
    const mobile = await tokens.createMobileSession(staffId);
    await api(web.accessToken).get('/me/permissions').expect(200);
    await api(mobile.accessToken).get('/me/permissions').expect(200);

    const off = await api().patch(`/staff/${staffId}`, { isActive: false }).expect(200);
    expect(off.body.data.isActive).toBe(false);
    await api(web.accessToken).get('/me/permissions').expect(401);
    await api(mobile.accessToken).get('/me/permissions').expect(401);
    expect(await tokens.rotate(web.refreshToken)).toEqual({ status: 'invalid' });
    expect(await tokens.rotate(mobile.refreshToken)).toEqual({ status: 'invalid' });
    expect((await lineLogin('U-beam', 'Beam')).headers.location).toBe(`${FRONTEND}/login?error=not_registered`);

    // A different person's session is untouched.
    await api().get('/staff').expect(200);

    const on = await api().patch(`/staff/${staffId}`, { isActive: true }).expect(200);
    expect(on.body.data).toMatchObject({ isActive: true, memberships: [{ groupId: GROUPS.staff, state: 'live' }] });
    expect((await lineLogin('U-beam', 'Beam')).headers.location).toBe(`${FRONTEND}/`);
  });

  it('AC-6: a session that was rotated before the deactivation is ended too', async () => {
    const staffId = await approvedStaff();
    const tokens = app.get(TokenService);
    const session = await tokens.createSession(staffId);
    const rotated = await tokens.rotate(session.refreshToken);
    if (rotated.status !== 'ok') throw new Error('rotation failed');
    await api().patch(`/staff/${staffId}`, { isActive: false }).expect(200);
    await api(rotated.accessToken).get('/me/permissions').expect(401);
    expect(await tokens.rotate(rotated.refreshToken)).toEqual({ status: 'invalid' });
  });

  it('AC-6: a session issued before the family index existed is logged out too (inactive = logged out on every token)', async () => {
    const staffId = await approvedStaff();
    const tokens = app.get(TokenService);
    const web = await tokens.createSession(staffId);
    const mobile = await tokens.createMobileSession(staffId);
    await redis.client.del(`user-families:${staffId}`); // what a pre-change session looks like
    await api(web.accessToken).get('/auth/me').expect(200);

    await api().patch(`/staff/${staffId}`, { isActive: false }).expect(200);
    await api(web.accessToken).get('/auth/me').expect(401);
    await api(mobile.accessToken).get('/auth/me').expect(401);
    expect(await tokens.authenticateAccessToken(web.accessToken)).toBeNull(); // the WS /staff handshake uses this
    expect(await tokens.rotate(web.refreshToken)).toEqual({ status: 'invalid' });
    expect(await tokens.rotate(mobile.refreshToken)).toEqual({ status: 'invalid' });
  });

  it('AC-7: effective permissions list where each code comes from', async () => {
    const manager = await insertStaff(dataSource, 'ผู้จัดการ', 'ผู้จัดการ');
    const policy: Array<{ id: string }> = await dataSource.query(`INSERT INTO policy (name) VALUES ('งานพิเศษ') RETURNING id`);
    await dataSource.query(
      `INSERT INTO policy_permission (policy_id, permission_id)
       SELECT $1, id FROM permission WHERE (resource, action) IN (('menu', 'read'), ('venue', 'update_payment'))`,
      [policy[0]?.id],
    );
    await dataSource.query(`INSERT INTO user_policy (user_id, policy_id) VALUES ($1, $2)`, [manager, policy[0]?.id]);

    const body = (await api().get(`/staff/${manager}/effective-permissions`).expect(200)).body.data;
    const byCode = new Map<string, Array<{ kind: string; groupName?: string; policyName: string }>>(
      body.permissions.map((entry: { code: string; sources: never[] }) => [entry.code, entry.sources]),
    );
    expect(byCode.get('venue:update_payment')).toEqual([{ kind: 'user', policyName: 'งานพิเศษ' }]);
    const both = byCode.get('menu:read') ?? [];
    expect(both.map((source) => source.kind).sort()).toEqual(['group', 'user']);
    expect(both.find((source) => source.kind === 'group')).toMatchObject({ groupName: 'ผู้จัดการ' });
    expect(byCode.has('staff:manage')).toBe(false);
    await api().get(`/staff/${UNKNOWN}/effective-permissions`).expect(404);
  });

  it('AC-8: without staff:manage every route answers 403 with the missing code', async () => {
    const manager = await insertStaff(dataSource, 'ผู้จัดการ', 'ผู้จัดการ');
    const staff = await insertStaff(dataSource, 'พนักงาน', 'พนักงาน');
    for (const id of [manager, staff]) {
      const token = (await staffSession(app, id)).accessToken;
      const calls = [
        () => api(token).get('/staff/access-requests'),
        () => api(token).post(`/staff/access-requests/${UNKNOWN}/approve`, approveBody()),
        () => api(token).post(`/staff/access-requests/${UNKNOWN}/reject`),
        () => api(token).post(`/staff/access-requests/${UNKNOWN}/reopen`),
        () => api(token).get('/staff'),
        () => api(token).get(`/staff/${UNKNOWN}`),
        () => api(token).patch(`/staff/${UNKNOWN}`, { isActive: false }),
        () => api(token).put(`/staff/${UNKNOWN}/memberships`, { memberships: [] }),
        () => api(token).get(`/staff/${UNKNOWN}/effective-permissions`),
      ];
      for (const call of calls) {
        const denied = await call().expect(403);
        expect(denied.body).toMatchObject({ status: 403, code: 'FORBIDDEN', data: { missing: ['staff:manage'] } });
      }
    }
  });

  it('AC-9: every successful write bumps iam:version and the change shows on the next request', async () => {
    const requestId = await pendingRequestId('U-beam', 'Beam');
    const steps: Array<() => request.Test> = [
      () => api().post(`/staff/access-requests/${requestId}/reject`),
      () => api().post(`/staff/access-requests/${requestId}/reopen`),
      () => api().post(`/staff/access-requests/${requestId}/approve`, approveBody()),
    ];
    for (const step of steps) {
      const before = await iamVersion();
      await step().expect(201);
      expect(await iamVersion()).toBe(before + 1);
    }
    const staffId = (await api().get('/staff').expect(200)).body.data.find(
      (member: { displayName: string }) => member.displayName === 'บีม',
    ).id as string;
    const token = (await staffSession(app, staffId)).accessToken;
    expect((await api(token).get('/me/permissions').expect(200)).body.data.permissions).toHaveLength(12);

    const before = await iamVersion();
    await api().put(`/staff/${staffId}/memberships`, approveBody('permanent', GROUPS.owner)).expect(200);
    expect(await iamVersion()).toBe(before + 1);
    expect((await api(token).get('/me/permissions').expect(200)).body.data.permissions).toHaveLength(20);

    await api().patch(`/staff/${staffId}`, { displayName: 'บีม 2' }).expect(200);
    expect(await iamVersion()).toBe(before + 2);

    const refused = await iamVersion();
    await api().put(`/staff/${owner}/memberships`, approveBody('permanent', GROUPS.manager)).expect(200);
    await api(token).put(`/staff/${staffId}/memberships`, { memberships: [] }).expect(409);
    expect(await iamVersion()).toBe(refused + 1);
  });

  it('lists staff active first, then by name, with the person’s LINE avatar', async () => {
    const id = await approvedStaff('U-avatar');
    await dataSource.query(`UPDATE staff_user_identity SET avatar_url = 'https://cdn.example/a.png' WHERE user_id = $1`, [id]);
    const off = await insertStaff(dataSource, 'A ปิดอยู่', 'พนักงาน');
    await dataSource.query(`UPDATE staff_user SET is_active = FALSE WHERE id = $1`, [off]);
    const listed = (await api().get('/staff').expect(200)).body.data as Array<{ id: string; isActive: boolean; avatarUrl: string | null }>;
    expect(listed.map((member) => member.isActive)).toEqual([true, true, false]);
    expect(listed.find((member) => member.id === id)?.avatarUrl).toBe('https://cdn.example/a.png');
    await api().get(`/staff/${UNKNOWN}`).expect(404);
    await api().patch(`/staff/${UNKNOWN}`, { displayName: 'x' }).expect(404);
    await api().patch(`/staff/${id}`, {}).expect(400);
  });
});
