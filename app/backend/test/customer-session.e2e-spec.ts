import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CustomerMenuSchema, CustomerSessionSchema, type CustomerMenu } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { CLOCK } from '../src/common/clock.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const FRIDAY_2300 = new Date('2026-10-16T16:00:00.000Z');
const HOUR = 60 * 60 * 1000;

describe('Customer QR session (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let now = FRIDAY_2300;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await app.get(RedisService).client.flushdb();
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    now = FRIDAY_2300;
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    accessToken = (await staffSession(app, await insertStaff(dataSource, 'Owner'))).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('creates a seat-only session with a hardened cookie and stores only the hash (AC-1)', async () => {
    const response = await scan(await qrOf('T3')).expect(201);
    expect(CustomerSessionSchema.parse(response.body.data)).toMatchObject({
      seat: { label: 'T3', kind: 'table' },
      visitId: null,
      displayName: null,
    });
    const header = String(response.headers['set-cookie']);
    expect(header).toMatch(/^guest_session=/);
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/SameSite=Lax/);
    expect(header).toMatch(/Path=\/api\/customer/);
    expect(header).not.toMatch(/Expires|Max-Age/);

    const rows: Array<Record<string, unknown>> = await dataSource.query('SELECT * FROM guest_session');
    expect(rows).toHaveLength(1);
    expect(String(rows[0]?.token_hash)).toHaveLength(64);
    expect(JSON.stringify(rows[0])).not.toContain(cookieValue(response));
  });

  it('gives each phone on an open visit its own session, and a rescan reuses it (AC-2)', async () => {
    const seat = await seatByLabel('T3');
    const visit = (await openVisit(seat.id)).body.data.visit.id as string;
    const phoneA = await scan(seat.qr).expect(201);
    const phoneB = await scan(seat.qr).expect(201);
    expect(phoneA.body.data.visitId).toBe(visit);
    expect(phoneB.body.data.visitId).toBe(visit);

    const again = await scan(seat.qr, cookieValue(phoneA)).expect(200);
    expect(again.headers['set-cookie']).toBeUndefined();
    const rows: unknown[] = await dataSource.query('SELECT id FROM guest_session');
    expect(rows).toHaveLength(2);

    await request(app.getHttpServer()).get('/api/customer/sessions').expect(404);
  });

  it('starts a new session when the cookie belongs to another seat', async () => {
    const first = await scan(await qrOf('T3')).expect(201);
    const second = await scan(await qrOf('T4'), cookieValue(first)).expect(201);
    expect(second.body.data.seat.label).toBe('T4');
  });

  it('rejects a bad body, an unknown QR and the 31st scan in a minute (AC-3)', async () => {
    await request(app.getHttpServer()).post('/api/customer/sessions').send({}).expect(400);
    const unknown = await scan('no-such-token').expect(404);
    expect(unknown.body).toMatchObject({ code: 'QR_INVALID', message: 'QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน' });

    await dataSource.query(`UPDATE table_seat SET is_active = false WHERE label = 'T6'`);
    await scan(await qrOf('T6')).expect(404);

    await app.get(RedisService).client.flushdb();
    for (let i = 0; i < 30; i += 1) await scan('no-such-token').expect(404);
    const limited = await scan('no-such-token').expect(429);
    expect(limited.body.code).toBe('RATE_LIMITED');
  });

  it('keeps scanning when Redis fails (AC-9)', async () => {
    const client = app.get(RedisService).client;
    const spy = vi.spyOn(client, 'multi').mockImplementation(() => {
      throw new Error('ECONNREFUSED');
    });
    try {
      await scan(await qrOf('T3')).expect(201);
    } finally {
      spy.mockRestore();
    }
  });

  describe('guard (AC-4)', () => {
    it('rejects a missing or garbage cookie', async () => {
      const missing = await request(app.getHttpServer()).get('/api/customer/session').expect(401);
      expect(missing.body).toMatchObject({
        code: 'GUEST_SESSION_INVALID',
        message: 'เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง',
      });
      await getWith('garbage').expect(401);
    });

    it('rejects an expired seat-only session', async () => {
      const cookie = cookieValue(await scan(await qrOf('T3')).expect(201));
      await alignCreatedAt();
      await getWith(cookie).expect(200);
      now = new Date(FRIDAY_2300.getTime() + 2 * HOUR + 1000);
      await getWith(cookie).expect(401);
    });

    it('rejects a session once its visit is closed', async () => {
      const seat = await seatByLabel('T3');
      const visit = (await openVisit(seat.id)).body.data.visit.id as string;
      const cookie = cookieValue(await scan(seat.qr).expect(201));
      await getWith(cookie).expect(200);
      await request(app.getHttpServer())
        .post(`/api/visits/${visit}/close`)
        .set({ Authorization: `Bearer ${accessToken}` })
        .expect(200);
      await getWith(cookie).expect(401);
    });

    it('rejects a session when its seat is deactivated', async () => {
      const cookie = cookieValue(await scan(await qrOf('T3')).expect(201));
      await dataSource.query(`UPDATE table_seat SET is_active = false WHERE label = 'T3'`);
      await getWith(cookie).expect(401);
    });

    it('does not accept the staff token on /customer, nor the guest cookie on a staff route', async () => {
      await request(app.getHttpServer())
        .get('/api/customer/menu')
        .set({ Authorization: `Bearer ${accessToken}` })
        .expect(401);
      await request(app.getHttpServer())
        .get('/api/customer/menu')
        .set('Cookie', `access_token=${accessToken}`)
        .expect(401);

      const cookie = cookieValue(await scan(await qrOf('T3')).expect(201));
      await request(app.getHttpServer())
        .get('/api/menu/items')
        .set('Cookie', `guest_session=${cookie}`)
        .expect(401);
    });
  });

  it('slides a seat-only session on use (AC-5)', async () => {
    const started = await scan(await qrOf('T3')).expect(201);
    const cookie = cookieValue(started);
    await alignCreatedAt();
    now = new Date(FRIDAY_2300.getTime() + 50 * 60 * 1000);
    const used = await getWith(cookie).expect(200);
    expect(used.body.data.expiresAt).toBe(new Date(now.getTime() + 2 * HOUR).toISOString());
  });

  it('caps a seat-only session at 60 min: never joins a visit opened later (BRIEF-050 AC-11)', async () => {
    const seat = await seatByLabel('T3');
    const old = cookieValue(await scan(seat.qr).expect(201));
    const fresh = cookieValue(await scan(seat.qr).expect(201));
    await alignCreatedAt();
    await openVisit(seat.id);
    now = new Date(FRIDAY_2300.getTime() + 61 * 60 * 1000);
    await dataSource.query(`UPDATE guest_session SET expires_at = $1 WHERE token_hash <> 'x'`, [new Date(now.getTime() + HOUR).toISOString()]);
    const rejected = await request(app.getHttpServer()).get('/api/customer/tab').set('Cookie', `guest_session=${old}`).expect(401);
    expect(rejected.body.code).toBe('GUEST_SESSION_INVALID');
    expect(fresh).not.toBe(old);
    const rows: Array<{ visit_id: string | null }> = await dataSource.query(`SELECT visit_id FROM guest_session`);
    expect(rows.every((row) => row.visit_id === null)).toBe(true);
  });

  it('trims, clears and bounds the nickname (AC-6)', async () => {
    const cookie = cookieValue(await scan(await qrOf('T3')).expect(201));
    const patch = (displayName: unknown) =>
      request(app.getHttpServer())
        .patch('/api/customer/session')
        .set('Cookie', `guest_session=${cookie}`)
        .send({ displayName });
    expect((await patch('  ต้น  ').expect(200)).body.data.displayName).toBe('ต้น');
    expect((await getWith(cookie).expect(200)).body.data.displayName).toBe('ต้น');
    expect((await patch('').expect(200)).body.data.displayName).toBeNull();
    await patch('ก'.repeat(31)).expect(400);
  });

  it('lists the customer menu without hidden, charge or POS-only data (AC-7)', async () => {
    await dataSource.query(`UPDATE menu_category SET is_active = false WHERE name = 'ไฮบอล'`);
    const cookie = cookieValue(await scan(await qrOf('T3')).expect(201));
    const response = await request(app.getHttpServer())
      .get('/api/customer/menu')
      .set('Cookie', `guest_session=${cookie}`)
      .expect(200);
    const menu: CustomerMenu = CustomerMenuSchema.parse(response.body.data);

    const names = menu.items.map((item) => item.name);
    expect(menu.categories.map((category) => category.name)).not.toContain('ไฮบอล');
    expect(names).not.toContain('ไฮบอลมะนาวโซดา');
    expect(names).not.toContain('ค่าเปิดขวด');
    expect(menu.categories.map((category) => category.name)).not.toContain('ค่าบริการ');
    expect(names).toContain('โอลด์แฟชั่น');

    const soldOut = menu.items.find((item) => item.name === 'ยำหมูยอ');
    expect(soldOut).toMatchObject({ availableNow: false, unavailableReason: 'sold_out' });
    const outOfWindow = menu.items.find((item) => item.name === 'ลีโอ 4 ขวด + ถังน้ำแข็ง');
    expect(outOfWindow).toMatchObject({ availableNow: false, unavailableReason: 'out_of_window', isPromo: true });
    expect(outOfWindow?.windows.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body.data)).not.toMatch(/"(station|itemType|sortOrder|updatedAt)":(?!\d)/);
  });

  it('purges expired seat-only rows on a scan and keeps visit-bound ones (AC-8)', async () => {
    const seat = await seatByLabel('T3');
    const visit = (await openVisit(seat.id)).body.data.visit.id as string;
    const past = new Date(FRIDAY_2300.getTime() - HOUR).toISOString();
    for (let i = 0; i < 3; i += 1) await insertSession(`seat-only-${i}`, seat.id, null, past);
    await insertSession('with-visit', seat.id, visit, past);

    await scan(await qrOf('T4')).expect(201);
    const left: Array<{ token_hash: string }> = await dataSource.query('SELECT token_hash FROM guest_session');
    const hashes = left.map((row) => row.token_hash.trim());
    expect(hashes.some((hash) => hash.startsWith('seat-only'))).toBe(false);
    expect(hashes.some((hash) => hash.startsWith('with-visit'))).toBe(true);
    expect(hashes).toHaveLength(2);
  });

  function scan(qrToken: string, cookie?: string) {
    const call = request(app.getHttpServer()).post('/api/customer/sessions');
    if (cookie) call.set('Cookie', `guest_session=${cookie}`);
    return call.send({ qrToken });
  }

  function getWith(cookie: string) {
    return request(app.getHttpServer()).get('/api/customer/session').set('Cookie', `guest_session=${cookie}`);
  }

  function cookieValue(response: request.Response): string {
    const header = String(response.headers['set-cookie']);
    return /guest_session=([^;]+)/.exec(header)?.[1] ?? '';
  }

  async function seatByLabel(label: string): Promise<{ id: string; qr: string }> {
    const rows: Array<{ id: string; qr_token: string }> = await dataSource.query(
      `SELECT id, qr_token FROM table_seat WHERE label = $1`,
      [label],
    );
    const row = rows[0];
    if (!row) throw new Error(`seat ${label} missing`);
    return { id: row.id, qr: row.qr_token };
  }

  async function qrOf(label: string): Promise<string> {
    return (await seatByLabel(label)).qr;
  }

  function openVisit(tableSeatId: string) {
    return request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ tableSeatId })
      .expect(201);
  }

  // The fake clock is not the database clock: pin created_at to it so the 60 min cap is measured on one timeline.
  async function alignCreatedAt(): Promise<void> {
    await dataSource.query(`UPDATE guest_session SET created_at = $1`, [FRIDAY_2300.toISOString()]);
  }

  async function insertSession(
    hashPrefix: string,
    tableSeatId: string,
    visitId: string | null,
    expiresAt: string,
  ): Promise<void> {
    await dataSource.query(
      `INSERT INTO guest_session (token_hash, table_seat_id, visit_id, expires_at) VALUES ($1, $2, $3, $4)`,
      [hashPrefix.padEnd(64, '0'), tableSeatId, visitId, expiresAt],
    );
  }
});
