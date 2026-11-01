import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { seedStaffMember } from '../src/cli/seed-iam.js';
import { IamVersion } from '../src/modules/iam/application/iam-version.service.js';
import { DEFAULT_GROUP_IDS } from '../src/modules/iam/domain/default-groups.js';
import { PermissionSource } from '../src/modules/iam/domain/permission-source.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const FORBIDDEN_MESSAGE = 'ไม่มีสิทธิ์ใช้งานส่วนนี้';

describe('IAM guard (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let owner: string;
  let manager: string;
  let staff: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    owner = await insertStaff(dataSource, 'เจ้าของ', 'เจ้าของ');
    manager = await insertStaff(dataSource, 'ผู้จัดการ', 'ผู้จัดการ');
    staff = await insertStaff(dataSource, 'พนักงาน', 'พนักงาน');
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(`UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`);
  });

  it('AC-2: staff can take orders but not confirm payments, edit the menu or read reports', async () => {
    const token = await tokenOf(staff);
    const visitId = await openSeat(token, 'T1');
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(bearer(token))
      .send({ items: [{ variantId: await beerVariant(), quantity: 1 }] })
      .expect(201);

    const paymentId = await pendingPayment(await tokenOf(owner), 'T2');
    const denied = await markPaid(token, paymentId);
    expect(denied.status).toBe(403);
    expect(denied.body).toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
      message: FORBIDDEN_MESSAGE,
      data: { missing: ['payments:mark_paid'] },
    });
    expect((await request(app.getHttpServer()).patch(`/api/menu/items/${UNKNOWN}`).set(bearer(token)).send({})).status).toBe(403);
    expect((await request(app.getHttpServer()).get('/api/reports/summary').set(bearer(token))).status).toBe(403);
  });

  it('AC-2: a manager confirms payments but cannot change the PromptPay ID; an owner can do both', async () => {
    const ownerToken = await tokenOf(owner);
    const managerToken = await tokenOf(manager);
    await markPaid(managerToken, await pendingPayment(ownerToken, 'T1')).expect(200);

    const refused = await patchPromptPay(managerToken);
    expect(refused.status).toBe(403);
    expect(refused.body.data).toEqual({ missing: ['venue:update_payment'] });

    await markPaid(ownerToken, await pendingPayment(ownerToken, 'T2')).expect(200);
    await patchPromptPay(ownerToken).expect(200);
  });

  it('Must fix 3: an expired or deactivated owner never switches enforcement off', async () => {
    await dataSource.query(`UPDATE user_group_membership SET valid_until = NOW() - interval '1 hour' WHERE user_id = $1`, [owner]);
    await dataSource.query(`UPDATE staff_user SET is_active = false WHERE id = $1`, [owner]);
    const denied = await markPaid(await tokenOf(staff), UNKNOWN);
    expect(denied.status).toBe(403);
    expect(denied.body.data).toEqual({ missing: ['payments:mark_paid'] });
  });

  it('AC-3: most permissive wins — a direct policy adds what the group lacks', async () => {
    const token = await tokenOf(staff);
    const paymentId = await pendingPayment(await tokenOf(owner), 'T1');
    expect((await markPaid(token, paymentId)).status).toBe(403);

    await dataSource.query(`INSERT INTO user_policy (user_id, policy_id) VALUES ($1, $2)`, [
      staff,
      '00000000-0000-4000-8000-0000000a0002',
    ]);
    await app.get(IamVersion).bump();
    await markPaid(token, paymentId).expect(200);
  });

  it('AC-4: an ended membership and a not-yet-started one give nothing', async () => {
    const ended = await insertStaff(dataSource, 'หมดอายุ', null);
    const future = await insertStaff(dataSource, 'ยังไม่เริ่ม', null);
    await dataSource.query(
      `INSERT INTO user_group_membership (user_id, group_id, valid_from, valid_until) VALUES ($1, $3, NOW() - interval '2 hours', NOW() - interval '1 hour'),
                                                                                           ($2, $3, NOW() + interval '1 hour', NULL)`,
      [ended, future, DEFAULT_GROUP_IDS.manager],
    );
    for (const id of [ended, future]) {
      const body = (await request(app.getHttpServer()).get('/api/me/permissions').set(bearer(await tokenOf(id))).expect(200)).body;
      expect(body.data).toEqual({ permissions: [], groups: [] });
    }
  });

  it('AC-5: the second request reads the cache; a version bump recomputes; Redis down still authorises', async () => {
    const token = await tokenOf(staff);
    const source = app.get(PermissionSource);
    const loads = vi.spyOn(source, 'codesFor');
    await me(token).expect(200);
    await me(token).expect(200);
    expect(loads).toHaveBeenCalledTimes(1);

    await app.get(IamVersion).bump();
    await me(token).expect(200);
    expect(loads).toHaveBeenCalledTimes(2);

    const client = app.get(RedisService).client;
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    // Sessions live in Redis too; only the IAM keys go dark here.
    const iamKey = (key: string): boolean => key.startsWith('perms:') || key === 'iam:version';
    const realGet = client.get.bind(client);
    const realSet = client.set.bind(client);
    const get = vi.spyOn(client, 'get').mockImplementation(((key: string) =>
      iamKey(key) ? Promise.reject(new Error('redis down')) : realGet(key)) as typeof client.get);
    const set = vi.spyOn(client, 'set').mockImplementation(((key: string, ...rest: unknown[]) =>
      iamKey(key)
        ? Promise.reject(new Error('redis down'))
        : (realSet as (...args: unknown[]) => unknown)(key, ...rest)) as typeof client.set);
    try {
      const during = await me(token).expect(200);
      expect(during.body.data.permissions).toContain('orders:create');
      expect((await markPaid(token, UNKNOWN)).status).toBe(403);
    } finally {
      get.mockRestore();
      set.mockRestore();
      vi.restoreAllMocks();
    }
  });

  it('AC-6: the same user gets the same answer by web cookie and by mobile Bearer', async () => {
    const session = await staffSession(app, staff);
    const bearerCall = await markPaid(session.accessToken, UNKNOWN);
    const cookieCall = await request(app.getHttpServer())
      .post(`/api/payments/${UNKNOWN}/mark-paid`)
      .set('Cookie', `access_token=${session.accessToken}`)
      .send({ via: 'cash' });
    expect(bearerCall.status).toBe(403);
    expect(cookieCall.status).toBe(403);
    expect(cookieCall.body).toEqual(bearerCall.body);

    const ownerSession = await staffSession(app, owner);
    const ownerCookie = await request(app.getHttpServer())
      .post(`/api/payments/${UNKNOWN}/mark-paid`)
      .set('Cookie', `access_token=${ownerSession.accessToken}`)
      .send({ via: 'cash' });
    expect(ownerCookie.status).toBe(404);
  });

  it('AC-7: /me/permissions lists codes and groups; a time-bound group shows validUntil', async () => {
    const until = new Date(Date.now() + 3_600_000);
    await dataSource.query(`UPDATE user_group_membership SET valid_until = $2 WHERE user_id = $1`, [manager, until]);
    const body = (await me(await tokenOf(manager)).expect(200)).body.data;
    expect(body.permissions).toHaveLength(18);
    expect(body.permissions).not.toContain('staff:manage');
    expect(body.groups).toEqual([
      { id: DEFAULT_GROUP_IDS.manager, name: 'ผู้จัดการ', validUntil: until.toISOString() },
    ]);
    expect((await me(await tokenOf(owner)).expect(200)).body.data.permissions).toHaveLength(20);
    await request(app.getHttpServer()).get('/api/me/permissions').expect(401);
  });

  it('AC-7: a deactivated user with a live session is logged out on every token (BRIEF-054: inactive = 401)', async () => {
    const token = await tokenOf(staff);
    await dataSource.query(`UPDATE staff_user SET is_active = false WHERE id = $1`, [staff]);
    await me(token).expect(401);
    expect((await markPaid(token, UNKNOWN)).status).toBe(401);
  });

  function bearer(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  async function tokenOf(staffId: string): Promise<string> {
    return (await staffSession(app, staffId)).accessToken;
  }

  function me(token: string): request.Test {
    return request(app.getHttpServer()).get('/api/me/permissions').set(bearer(token));
  }

  function markPaid(token: string, paymentId: string): request.Test {
    return request(app.getHttpServer())
      .post(`/api/payments/${paymentId}/mark-paid`)
      .set(bearer(token))
      .send({ via: 'cash' });
  }

  function patchPromptPay(token: string): request.Test {
    return request(app.getHttpServer())
      .patch('/api/venue/payment-settings')
      .set(bearer(token))
      .send({ promptpayId: '0899999999', promptpayIdType: 'mobile' });
  }

  async function openSeat(token: string, label: string): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(`SELECT id FROM table_seat WHERE label = $1`, [label]);
    const response = await request(app.getHttpServer())
      .post('/api/visits')
      .set(bearer(token))
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    return response.body.data.visit.id as string;
  }

  async function beerVariant(): Promise<string> {
    const rows: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id
        WHERE i.name = 'ช้างดราฟต์' AND v.name = 'ปกติ'`,
    );
    return rows[0]?.id ?? '';
  }

  async function pendingPayment(token: string, label: string): Promise<string> {
    const visitId = await openSeat(token, label);
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(bearer(token))
      .send({ items: [{ variantId: await beerVariant(), quantity: 1 }] })
      .expect(201);
    const paid = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set(bearer(token))
      .send({ method: 'promptpay', mode: 'merge' })
      .expect(201);
    return paid.body.data.parts[0].id as string;
  }
});

describe('IAM safety net (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const warn = vi.spyOn(Logger.prototype, 'warn');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    warn.mockImplementation(() => undefined);
    // The previous describe cleared every staff row in its afterAll, so bootstrap sees no owner.
    await app.init();
    dataSource = app.get(DataSource);
    await app.get(RedisService).client.flushdb();
  });

  afterAll(async () => {
    warn.mockRestore();
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  it('AC-9: with no owner nothing is denied and a warning is logged; once an owner is seeded the guard enforces', async () => {
    const staff = await insertStaff(dataSource, 'พนักงาน', 'พนักงาน');
    const token = (await staffSession(app, staff)).accessToken;
    const markPaid = (): request.Test =>
      request(app.getHttpServer())
        .post(`/api/payments/${UNKNOWN}/mark-paid`)
        .set({ Authorization: `Bearer ${token}` })
        .send({ via: 'cash' });

    expect((await markPaid()).status).toBe(404);
    expect(warn).toHaveBeenCalledWith('IAM: no owner — permissions NOT enforced');

    await seedStaffMember(dataSource, { lineUserId: 'U-new-owner', name: 'Owner', group: 'เจ้าของ' }, () =>
      app.get(IamVersion).bump(),
    );
    const denied = await markPaid();
    expect(denied.status).toBe(403);
    expect(denied.body.data).toEqual({ missing: ['payments:mark_paid'] });
  });
});
