import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

interface TableSeatDbRow {
  id: string;
  label: string;
  kind: string;
  sort_order: number;
  is_active: boolean;
  qr_token: string;
}

interface AuditLogRow {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  changed_fields: Record<string, unknown> | null;
  changed_by: string | null;
}

describe('Tables admin API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let serverToken: string;
  let ownerId: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.listen(0, '127.0.0.1');
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await app.get(RedisService).client.flushdb();
  });

  afterAll(async () => {
    for (const socket of sockets) socket.close();
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    for (const socket of sockets) socket.close();
    sockets.length = 0;
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    ownerId = await insertStaff(dataSource, 'Owner', 'เจ้าของ');
    const serverId = await insertStaff(dataSource, 'Server', 'พนักงาน');
    ownerToken = (await staffSession(app, ownerId)).accessToken;
    serverToken = (await staffSession(app, serverId)).accessToken;
    await seedVenue(dataSource);
  });

  async function connectStaffSocket(): Promise<Socket> {
    const socket = io(`http://127.0.0.1:${httpPort(app)}/staff`, {
      transports: ['websocket'],
      auth: { token: ownerToken },
    });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', reject);
    });
    return socket;
  }

  function waitForEvent<T = unknown>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => {
      socket.once(event, (data: T) => resolve(data));
    });
  }

  it('AC-1: POST /tables { T7, table } creates seat at end of section with fresh token, audit log, and WS event', async () => {
    const socket = await connectStaffSocket();
    const eventPromise = waitForEvent<{ seatIds: string[] }>(socket, 'tables.changed');

    const createRes = await request(app.getHttpServer())
      .post('/api/tables')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ label: 'T7', kind: 'table' })
      .expect(201);

    expect(createRes.body.status).toBe(201);
    const seat = createRes.body.data;
    expect(seat.label).toBe('T7');
    expect(seat.kind).toBe('table');
    expect(seat.isActive).toBe(true);
    expect(seat.sortOrder).toBe(7); // Seed has T1..T6 with sort_order 1..6
    expect(typeof seat.qrToken).toBe('string');
    expect(seat.qrToken.length).toBeGreaterThanOrEqual(43);
    expect(seat.hasLiveVisit).toBe(false);

    // Event emitted
    const eventPayload = await eventPromise;
    expect(eventPayload.seatIds).toContain(seat.id);

    // Appears in GET /tables (active list)
    const listRes = await request(app.getHttpServer())
      .get('/api/tables')
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);
    const activeLabels = listRes.body.data.items.map((i: { label: string }) => i.label);
    expect(activeLabels).toContain('T7');

    // Appears in GET /tables/manage
    const manageRes = await request(app.getHttpServer())
      .get('/api/tables/manage')
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);
    const manageSeats = manageRes.body.data.items;
    const foundInManage = manageSeats.find((i: { id: string }) => i.id === seat.id);
    expect(foundInManage).toBeDefined();
    expect(foundInManage.label).toBe('T7');
    expect(foundInManage.qrToken).toBe(seat.qrToken);

    // One audit log row recorded
    const auditRows: AuditLogRow[] = await dataSource.query(
      `SELECT * FROM audit_log WHERE entity = 'table_seat' AND entity_id = $1`,
      [seat.id],
    );
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0]?.action).toBe('CREATE');
    expect(auditRows[0]?.changed_by).toBe(ownerId);
  });

  it('AC-2: Duplicate label among active seats rejected with 409 SEAT_LABEL_TAKEN; inactive seat label can be reused', async () => {
    // 1. Try duplicate label with spaces / case difference
    const dupRes = await request(app.getHttpServer())
      .post('/api/tables')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ label: '  t1  ', kind: 'table' })
      .expect(409);
    expect(dupRes.body.code).toBe('SEAT_LABEL_TAKEN');

    // 2. Deactivate T1
    const t1Rows: TableSeatDbRow[] = await dataSource.query(`SELECT id FROM table_seat WHERE label = 'T1'`);
    const t1Id = t1Rows[0]?.id;
    if (!t1Id) throw new Error('T1 not found');

    await request(app.getHttpServer())
      .post(`/api/tables/${t1Id}/deactivate`)
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);

    // 3. Now creating a new seat with label 'T1' is allowed because previous T1 is inactive
    const createT1AgainRes = await request(app.getHttpServer())
      .post('/api/tables')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ label: 'T1', kind: 'table' })
      .expect(201);
    expect(createT1AgainRes.body.data.label).toBe('T1');
  });

  it('AC-3: PUT /tables/order reorders section; missing, extra, or cross-section id rejected with 400', async () => {
    const tableSeats: TableSeatDbRow[] = await dataSource.query(
      `SELECT id, label, sort_order FROM table_seat WHERE kind = 'table' ORDER BY sort_order`,
    );
    const tableIds = tableSeats.map((s) => s.id);
    expect(tableIds).toHaveLength(6);

    // Reversed order
    const reversed = [...tableIds].reverse();

    const socket = await connectStaffSocket();
    const eventPromise = waitForEvent<{ seatIds: string[] }>(socket, 'tables.changed');

    await request(app.getHttpServer())
      .put('/api/tables/order')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ kind: 'table', ids: reversed })
      .expect(200);

    await eventPromise;

    // Check sort_order updated 0..n-1
    const updatedRows: TableSeatDbRow[] = await dataSource.query(
      `SELECT id, sort_order FROM table_seat WHERE kind = 'table' ORDER BY sort_order`,
    );
    expect(updatedRows.map((r) => r.id)).toEqual(reversed);
    expect(updatedRows.map((r) => r.sort_order)).toEqual([0, 1, 2, 3, 4, 5]);

    // Validation checks:
    // Missing an id -> 400
    await request(app.getHttpServer())
      .put('/api/tables/order')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ kind: 'table', ids: reversed.slice(0, 5) })
      .expect(400);

    // Extra unknown id -> 400
    await request(app.getHttpServer())
      .put('/api/tables/order')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ kind: 'table', ids: [...reversed, '00000000-0000-4000-8000-000000000000'] })
      .expect(400);

    // ID from counter section passed to table section -> 400
    const counterRows: TableSeatDbRow[] = await dataSource.query(`SELECT id FROM table_seat WHERE kind = 'counter' LIMIT 1`);
    const counterId = counterRows[0]?.id;
    if (!counterId) throw new Error('Counter seat not found');

    const wrongSectionIds = [...reversed.slice(1), counterId];
    await request(app.getHttpServer())
      .put('/api/tables/order')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ kind: 'table', ids: wrongSectionIds })
      .expect(400);
  });

  it('AC-4: Deactivate seat with live visit -> 409 SEAT_IN_USE; without live visit -> deactivates, stops QR, refuses guest session', async () => {
    const t1Rows: TableSeatDbRow[] = await dataSource.query(`SELECT id, qr_token FROM table_seat WHERE label = 'T1'`);
    const t1 = t1Rows[0];
    if (!t1) throw new Error('T1 not found');

    // Start a guest session on T1
    const startRes = await request(app.getHttpServer())
      .post('/api/customer/sessions')
      .send({ qrToken: t1.qr_token })
      .expect(201);
    const guestCookie = /guest_session=([^;]+)/.exec(String(startRes.headers['set-cookie']))?.[1];
    if (!guestCookie) throw new Error('no guest cookie');

    // Open a live visit on T1
    const openRes = await request(app.getHttpServer())
      .post('/api/visits')
      .set('Cookie', `access_token=${ownerToken}`)
      .send({ tableSeatId: t1.id, guestLabel: 'ทดสอบ' })
      .expect(201);
    const visitId = openRes.body.data.visit.id;

    // Trying to deactivate while live visit exists -> 409 SEAT_IN_USE
    const busyRes = await request(app.getHttpServer())
      .post(`/api/tables/${t1.id}/deactivate`)
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(409);
    expect(busyRes.body.code).toBe('SEAT_IN_USE');

    // Close the visit
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);

    // Ring the bell on T1 to verify it gets cleared upon deactivation
    await dataSource.query(
      `UPDATE table_seat SET staff_called_at = NOW(), staff_call_reason = 'bill' WHERE id = $1`,
      [t1.id],
    );

    const socket = await connectStaffSocket();
    const bellClearedPromise = waitForEvent(socket, 'table.staff_call_cleared');

    // Deactivate T1 now that visit is closed
    const deactRes = await request(app.getHttpServer())
      .post(`/api/tables/${t1.id}/deactivate`)
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);
    expect(deactRes.body.data.isActive).toBe(false);

    // Bell cleared event received
    await bellClearedPromise;

    // T1 gone from active GET /tables
    const activeList = await request(app.getHttpServer())
      .get('/api/tables')
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);
    expect(activeList.body.data.items.some((i: { id: string }) => i.id === t1.id)).toBe(false);

    // New QR scan on deactivated seat fails with QR_INVALID
    const failScan = await request(app.getHttpServer())
      .post('/api/customer/sessions')
      .send({ qrToken: t1.qr_token })
      .expect(404);
    expect(failScan.body.code).toBe('QR_INVALID');

    // Existing guest session call on deactivated seat fails with GUEST_SESSION_INVALID
    const guestCall = await request(app.getHttpServer())
      .post('/api/customer/call-staff')
      .set('Cookie', `guest_session=${guestCookie}`)
      .send({ reason: 'other', note: 'เรียกพนักงาน' })
      .expect(401);
    expect(guestCall.body.code).toBe('GUEST_SESSION_INVALID');
  });

  it('AC-5: Activate brings seat back to GET /tables with same qrToken and printed QR works again', async () => {
    const t2Rows: TableSeatDbRow[] = await dataSource.query(`SELECT id, qr_token FROM table_seat WHERE label = 'T2'`);
    const t2 = t2Rows[0];
    if (!t2) throw new Error('T2 not found');

    // Deactivate T2
    await request(app.getHttpServer())
      .post(`/api/tables/${t2.id}/deactivate`)
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);

    // Activate T2
    const actRes = await request(app.getHttpServer())
      .post(`/api/tables/${t2.id}/activate`)
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);
    expect(actRes.body.data.isActive).toBe(true);
    expect(actRes.body.data.qrToken).toBe(t2.qr_token); // Same qr_token preserved

    // T2 back in GET /tables
    const listRes = await request(app.getHttpServer())
      .get('/api/tables')
      .set('Cookie', `access_token=${ownerToken}`)
      .expect(200);
    expect(listRes.body.data.items.some((i: { id: string }) => i.id === t2.id)).toBe(true);

    // Printed QR starts a customer session again
    const scanRes = await request(app.getHttpServer())
      .post('/api/customer/sessions')
      .send({ qrToken: t2.qr_token })
      .expect(201);
    expect(scanRes.body.data.seat.id).toBe(t2.id);
  });

  it('AC-6: Without tables:manage permission -> 403 on all admin routes; GET /tables never exposes qrToken', async () => {
    // 1. Staff without tables:manage tries admin routes -> 403
    await request(app.getHttpServer())
      .get('/api/tables/manage')
      .set('Cookie', `access_token=${serverToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/tables')
      .set('Cookie', `access_token=${serverToken}`)
      .send({ label: 'T8', kind: 'table' })
      .expect(403);

    const t3Rows: TableSeatDbRow[] = await dataSource.query(`SELECT id FROM table_seat WHERE label = 'T3'`);
    const t3Id = t3Rows[0]?.id;
    if (!t3Id) throw new Error('T3 not found');

    await request(app.getHttpServer())
      .patch(`/api/tables/${t3Id}`)
      .set('Cookie', `access_token=${serverToken}`)
      .send({ label: 'T3-renamed' })
      .expect(403);

    await request(app.getHttpServer())
      .put('/api/tables/order')
      .set('Cookie', `access_token=${serverToken}`)
      .send({ kind: 'table', ids: [t3Id] })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/tables/${t3Id}/deactivate`)
      .set('Cookie', `access_token=${serverToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/tables/${t3Id}/activate`)
      .set('Cookie', `access_token=${serverToken}`)
      .expect(403);

    // 2. GET /tables succeeds with tables:read but NEVER exposes qrToken
    const activeRes = await request(app.getHttpServer())
      .get('/api/tables')
      .set('Cookie', `access_token=${serverToken}`)
      .expect(200);

    const items = activeRes.body.data.items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.qrToken).toBeUndefined();
    }
  });
});
