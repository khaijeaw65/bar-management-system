import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { DataSource } from 'typeorm';
import request from 'supertest';
import {
  NOTIFICATION_NEW,
  type Notification,
} from '@bar/contracts';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { TokenService } from '../src/modules/auth/application/token.service.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { TableSeatService } from '../src/modules/venue/application/table-seat.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import {
  asGuest,
  seatByLabel,
  startGuest,
  variantByName,
} from './customer-fixtures.js';
import {
  clearStaffAndVenue,
  httpPort,
  insertStaff,
  staffSession,
} from './staff-session.js';

describe('Notifications gateway and feed (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.listen(0, '127.0.0.1');
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await app.get(RedisService).client.flushdb();
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
  });

  it('refuses a socket with no token, a bad token, or a revoked session', async () => {
    const port = httpPort(app);
    await expect(connect(port)).rejects.toThrow();
    await expect(connect(port, { token: 'not-a-jwt' })).rejects.toThrow();

    const staffId = await insertStaff(dataSource, 'Owner');
    const session = await staffSession(app, staffId);
    await app.get(TokenService).revokeByRefreshToken(session.refreshToken);
    await expect(connect(port, { token: session.accessToken })).rejects.toThrow();
  });

  it('refuses a foreign Origin even with a live token', async () => {
    const staffId = await insertStaff(dataSource, 'Owner');
    const session = await staffSession(app, staffId);
    await expect(
      connect(httpPort(app), {
        token: session.accessToken,
        origin: 'https://evil.example',
      }),
    ).rejects.toThrow();
  });

  it('accepts the access token from auth.token and from the cookie', async () => {
    const staffId = await insertStaff(dataSource, 'Owner');
    const session = await staffSession(app, staffId);
    const port = httpPort(app);

    const byAuth = await connect(port, { token: session.accessToken });
    byAuth.close();
    const byCookie = await connect(port, { cookie: session.accessToken });
    byCookie.close();
  });

  it('delivers order.created and ticket.status_changed on the staff room', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    const staffId = await insertStaff(dataSource, 'เอ');
    const session = await staffSession(app, staffId);
    const socket = await connect(httpPort(app), { token: session.accessToken });
    const created = once(socket, 'order.created');
    const changed = once(socket, 'ticket.status_changed');

    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = 'T1'`,
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );
    const ordered = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);
    const order = await created;
    expect(order).toMatchObject({ id: ordered.body.data.id, orderNumber: 1 });

    const ticketId = ordered.body.data.tickets[0].id as string;
    await request(app.getHttpServer())
      .post(`/api/tickets/${ticketId}/accept`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);
    const event = await changed;
    expect(event).toMatchObject({
      ticketId,
      status: 'accepted',
      updatedBy: { displayName: 'เอ' },
    });
    socket.close();
  });

  it('emits nothing when placement rolls back', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    const staffId = await insertStaff(dataSource, 'เอ');
    const session = await staffSession(app, staffId);
    const socket = await connect(httpPort(app), { token: session.accessToken });
    const events: unknown[] = [];
    socket.on('order.created', (payload) => events.push(payload));

    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = 'T2'`,
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    const visitId = opened.body.data.visit.id as string;
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(409);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(events).toEqual([]);
    socket.close();
  });

  it('AC-1: POS order by staff P creates notification for other holders of orders:update_status, not P, and delivers live on socket', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);

    const placerId = await insertStaff(dataSource, 'Placer P');
    const staff1Id = await insertStaff(dataSource, 'Staff S1');
    const staff2Id = await insertStaff(dataSource, 'Staff S2');

    const placerSession = await staffSession(app, placerId);
    const staff1Session = await staffSession(app, staff1Id);
    const staff2Session = await staffSession(app, staff2Id);

    const port = httpPort(app);
    const socketP = await connect(port, { token: placerSession.accessToken });
    const socket1 = await connect(port, { token: staff1Session.accessToken });
    const socket2 = await connect(port, { token: staff2Session.accessToken });

    const pNotifs: unknown[] = [];
    const s1Notifs: unknown[] = [];
    const s2Notifs: unknown[] = [];
    socketP.on(NOTIFICATION_NEW, (payload) => pNotifs.push(payload));
    socket1.on(NOTIFICATION_NEW, (payload) => s1Notifs.push(payload));
    socket2.on(NOTIFICATION_NEW, (payload) => s2Notifs.push(payload));

    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = 'T1'`,
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${placerSession.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);

    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );

    const s1Promised = once(socket1, NOTIFICATION_NEW);
    const s2Promised = once(socket2, NOTIFICATION_NEW);

    const ordered = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set({ Authorization: `Bearer ${placerSession.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 2 }] })
      .expect(201);

    const s1Event = (await s1Promised) as Notification;
    const s2Event = (await s2Promised) as Notification;

    expect(s1Event).toMatchObject({
      type: 'order_new',
      title: 'ออเดอร์ใหม่ · T1',
      body: '2 รายการ',
      refType: 'order',
      refId: ordered.body.data.id,
      recipientId: staff1Id,
    });
    expect(s2Event).toMatchObject({
      type: 'order_new',
      title: 'ออเดอร์ใหม่ · T1',
      body: '2 รายการ',
      refType: 'order',
      refId: ordered.body.data.id,
      recipientId: staff2Id,
    });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(pNotifs).toEqual([]);

    const rows: Array<{ recipient_id: string; type: string }> = await dataSource.query(
      `SELECT recipient_id, type FROM notification ORDER BY recipient_id`,
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.recipient_id).sort()).toEqual([staff1Id, staff2Id].sort());
    expect(rows.every((r) => r.type === 'order_new')).toBe(true);

    socketP.close();
    socket1.close();
    socket2.close();
  });

  it('AC-2: call-staff with reason bill creates rows without guest note; reason transfer creates zero rows', async () => {
    await seedVenue(dataSource);
    await insertStaff(dataSource, 'Staff User');

    const seat = await seatByLabel(dataSource, 'T1');
    const guestCookie = await startGuest(app, seat.qr);

    await asGuest(app, 'post', '/call-staff', guestCookie)
      .send({ reason: 'bill', note: 'secret-pdpa-note' })
      .expect(201);

    const rowsBill: Array<{ type: string; title: string; body: string; ref_id: string }> =
      await dataSource.query(`SELECT type, title, body, ref_id FROM notification`);
    expect(rowsBill).toHaveLength(1);
    expect(rowsBill[0]).toMatchObject({
      type: 'call_staff',
      title: 'T1 เรียกพนักงาน',
      body: 'เช็คบิล',
      ref_id: seat.id,
    });
    expect(rowsBill[0]?.body).not.toContain('secret-pdpa-note');

    // Transfer call
    await dataSource.query(`DELETE FROM notification`);
    await app.get(TableSeatService).callStaff(seat.id, { reason: 'transfer', note: 'transfer-proof' });

    const rowsTransfer = await dataSource.query(`SELECT id FROM notification`);
    expect(rowsTransfer).toEqual([]);
  });

  it('AC-3: kitchen screen on and /tickets/:id/ready sends food_ready to creator; QR order sends to orders:update_status holders', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(`UPDATE venue SET kitchen_display_enabled = true`);

    const creatorId = await insertStaff(dataSource, 'Creator Staff');
    const otherStaffId = await insertStaff(dataSource, 'Other Staff');
    const creatorSession = await staffSession(app, creatorId);

    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = 'T1'`,
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${creatorSession.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);

    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );
    const ordered = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set({ Authorization: `Bearer ${creatorSession.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);

    const ticketId = ordered.body.data.tickets[0].id as string;
    await request(app.getHttpServer())
      .post(`/api/tickets/${ticketId}/accept`)
      .set({ Authorization: `Bearer ${creatorSession.accessToken}` })
      .expect(200);

    await dataSource.query(`DELETE FROM notification`);

    await request(app.getHttpServer())
      .post(`/api/tickets/${ticketId}/ready`)
      .set({ Authorization: `Bearer ${creatorSession.accessToken}` })
      .expect(200);

    const rowsCreator: Array<{ recipient_id: string; type: string; title: string; body: string }> =
      await dataSource.query(`SELECT recipient_id, type, title, body FROM notification`);
    expect(rowsCreator).toHaveLength(1);
    expect(rowsCreator[0]).toMatchObject({
      recipient_id: creatorId,
      type: 'food_ready',
      title: 'ออเดอร์ #1 พร้อมเสิร์ฟ',
      body: 'T1',
    });

    // Case 2: QR order (no creator)
    await dataSource.query(`DELETE FROM notification`);
    const seat2 = await seatByLabel(dataSource, 'T2');
    const guestCookie = await startGuest(app, seat2.qr);

    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const guestOrder = await asGuest(app, 'post', '/orders', guestCookie)
      .send({ items: [{ variantId: beer.variantId, quantity: 1 }] })
      .expect(201);

    const tickets: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM order_ticket WHERE order_id = $1`,
      [guestOrder.body.data.orderId],
    );
    const qrTicketId = tickets[0]?.id as string;
    await request(app.getHttpServer())
      .post(`/api/tickets/${qrTicketId}/accept`)
      .set({ Authorization: `Bearer ${creatorSession.accessToken}` })
      .expect(200);

    await dataSource.query(`DELETE FROM notification`);

    await request(app.getHttpServer())
      .post(`/api/tickets/${qrTicketId}/ready`)
      .set({ Authorization: `Bearer ${creatorSession.accessToken}` })
      .expect(200);

    const rowsQr: Array<{ recipient_id: string; type: string }> =
      await dataSource.query(`SELECT recipient_id, type FROM notification`);
    expect(rowsQr.map((r) => r.recipient_id).sort()).toEqual([creatorId, otherStaffId].sort());
  });

  it('AC-4: deactivated staff or expired membership receives no rows', async () => {
    await seedVenue(dataSource);
    const activeStaffId = await insertStaff(dataSource, 'Active Staff');
    const inactiveStaffId = await insertStaff(dataSource, 'Inactive Staff');
    const expiredStaffId = await insertStaff(dataSource, 'Expired Staff');

    await dataSource.query(`UPDATE staff_user SET is_active = false WHERE id = $1`, [inactiveStaffId]);
    await dataSource.query(
      `UPDATE user_group_membership SET valid_until = NOW() - INTERVAL '1 hour' WHERE user_id = $1`,
      [expiredStaffId],
    );

    const seat = await seatByLabel(dataSource, 'T1');
    const guestCookie = await startGuest(app, seat.qr);
    await asGuest(app, 'post', '/call-staff', guestCookie)
      .send({ reason: 'bill' })
      .expect(201);

    const rows: Array<{ recipient_id: string }> = await dataSource.query(`SELECT recipient_id FROM notification`);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.recipient_id).toBe(activeStaffId);
  });

  it('AC-5: feed pagination, unread-count, PATCH read (own vs foreign), and PATCH read-all', async () => {
    const user1Id = await insertStaff(dataSource, 'User 1');
    const user2Id = await insertStaff(dataSource, 'User 2');
    const session1 = await staffSession(app, user1Id);
    const session2 = await staffSession(app, user2Id);

    // Insert 25 notifications for user1, 1 for user2
    for (let i = 1; i <= 25; i++) {
      await dataSource.query(
        `INSERT INTO notification (recipient_id, type, title, body, created_at)
         VALUES ($1, 'order_new', $2, 'item', NOW() + ($3 || ' seconds')::interval)`,
        [user1Id, `Notif ${i}`, i],
      );
    }
    await dataSource.query(
      `INSERT INTO notification (recipient_id, type, title, body)
       VALUES ($1, 'order_new', 'User 2 Notif', 'item')`,
      [user2Id],
    );

    // GET /notifications (page 1)
    const page1 = await request(app.getHttpServer())
      .get('/api/notifications')
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);

    expect(page1.body.data.items).toHaveLength(20);
    expect(page1.body.data.nextCursor).toBeDefined();
    expect(page1.body.data.items[0].title).toBe('Notif 25'); // newest first
    expect(page1.body.data.items.every((i: Notification) => i.recipientId === user1Id)).toBe(true);

    // GET /notifications (page 2 with cursor)
    const page2 = await request(app.getHttpServer())
      .get(`/api/notifications?cursor=${encodeURIComponent(page1.body.data.nextCursor)}`)
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);

    expect(page2.body.data.items).toHaveLength(5);
    expect(page2.body.data.nextCursor).toBeNull();
    expect(page2.body.data.items[4].title).toBe('Notif 1');

    // GET /notifications/unread-count
    const countRes = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);
    expect(countRes.body.data.count).toBe(25);

    // PATCH /notifications/:id/read on foreign notification -> 404
    const user2Notifs = await dataSource.query(`SELECT id FROM notification WHERE recipient_id = $1`, [user2Id]);
    await request(app.getHttpServer())
      .patch(`/api/notifications/${user2Notifs[0].id}/read`)
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(404);

    // PATCH /notifications/:id/read on own notification
    const ownNotifId = page1.body.data.items[0].id;
    const readRes1 = await request(app.getHttpServer())
      .patch(`/api/notifications/${ownNotifId}/read`)
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);
    expect(readRes1.body.data.readAt).toBeDefined();

    // Idempotent
    const readRes2 = await request(app.getHttpServer())
      .patch(`/api/notifications/${ownNotifId}/read`)
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);
    expect(readRes2.body.data.readAt).toBe(readRes1.body.data.readAt);

    // PATCH /notifications/read-all
    const readAllRes1 = await request(app.getHttpServer())
      .patch('/api/notifications/read-all')
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);
    expect(readAllRes1.body.data.updated).toBe(24);

    // Second read-all -> updated: 0
    const readAllRes2 = await request(app.getHttpServer())
      .patch('/api/notifications/read-all')
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);
    expect(readAllRes2.body.data.updated).toBe(0);

    // Count is now 0 for user1
    const finalCount = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set({ Authorization: `Bearer ${session1.accessToken}` })
      .expect(200);
    expect(finalCount.body.data.count).toBe(0);

    // User2's notification is still unread
    const user2Count = await request(app.getHttpServer())
      .get('/api/notifications/unread-count')
      .set({ Authorization: `Bearer ${session2.accessToken}` })
      .expect(200);
    expect(user2Count.body.data.count).toBe(1);
  });

  it('AC-5 sub-ms cursor: two rows inside the same millisecond are not skipped across pages', async () => {
    const userId = await insertStaff(dataSource, 'Sub-ms User');
    const session = await staffSession(app, userId);

    // Insert 19 newer items, then Row 20 and Row 21 which share the same millisecond (.500s).
    // The page size is 20, so the boundary falls exactly between Row 20 and Row 21.
    for (let i = 1; i <= 19; i++) {
      await dataSource.query(
        `INSERT INTO notification (recipient_id, type, title, body, created_at)
         VALUES ($1, 'order_new', $2, 'item', '2026-11-01 11:00:00+00'::timestamptz + ($3 || ' seconds')::interval)`,
        [userId, `Newer ${i}`, i],
      );
    }
    await dataSource.query(
      `INSERT INTO notification (recipient_id, type, title, body, created_at)
       VALUES ($1, 'order_new', 'Row 20 SameMs', 'item', '2026-11-01 10:59:00.500500+00'::timestamptz)`,
      [userId],
    );
    await dataSource.query(
      `INSERT INTO notification (recipient_id, type, title, body, created_at)
       VALUES ($1, 'order_new', 'Row 21 SameMs', 'item', '2026-11-01 10:59:00.500100+00'::timestamptz)`,
      [userId],
    );

    // GET /notifications (page 1: 20 items, newest first)
    const page1 = await request(app.getHttpServer())
      .get('/api/notifications')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    expect(page1.body.data.items).toHaveLength(20);
    // The 20th item on page 1 is Row 20
    expect(page1.body.data.items[19].title).toBe('Row 20 SameMs');
    const cursor = page1.body.data.nextCursor;
    expect(cursor).toBeDefined();

    // Page 2 must return Row 21 (which has the same millisecond timestamp .500s) without skipping it
    const page2 = await request(app.getHttpServer())
      .get(`/api/notifications?cursor=${encodeURIComponent(cursor)}`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    expect(page2.body.data.items).toHaveLength(1);
    expect(page2.body.data.items[0].title).toBe('Row 21 SameMs');
    expect(page2.body.data.nextCursor).toBeNull();

    // Invalid cursor returns 400
    await request(app.getHttpServer())
      .get('/api/notifications?cursor=not-a-valid-uuid')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(400);
  });

  it('AC-6: failure inside notify never fails the trigger request (best effort)', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(`UPDATE venue SET kitchen_display_enabled = true`);

    const staffId = await insertStaff(dataSource, 'Staff User');
    await insertStaff(dataSource, 'Other Staff');
    const session = await staffSession(app, staffId);

    // 1. call-staff succeeds despite notification service failure
    const seat = await seatByLabel(dataSource, 'T1');
    const guestCookie = await startGuest(app, seat.qr);

    const notifySpy = vi.spyOn(app.get(NotificationsService), 'notify').mockRejectedValueOnce(new Error('simulated notify failure'));

    await asGuest(app, 'post', '/call-staff', guestCookie)
      .send({ reason: 'bill' })
      .expect(201);

    expect(notifySpy).toHaveBeenCalledTimes(1);

    // 2. POST /api/visits/:id/orders succeeds (201 + order saved) despite notify failure
    const seats: Array<{ id: string }> = await dataSource.query(`SELECT id FROM table_seat WHERE label = 'T2'`);
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);

    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );

    notifySpy.mockRejectedValueOnce(new Error('simulated order notify failure'));

    const ordered = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);

    expect(notifySpy).toHaveBeenCalledTimes(2);
    const savedOrders: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM order_record WHERE id = $1`,
      [ordered.body.data.id],
    );
    expect(savedOrders).toHaveLength(1);

    // 3. POST /api/tickets/:id/ready succeeds (200 + ticket ready) despite notify failure
    const ticketId = ordered.body.data.tickets[0].id as string;
    await request(app.getHttpServer())
      .post(`/api/tickets/${ticketId}/accept`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    notifySpy.mockRejectedValueOnce(new Error('simulated ready notify failure'));

    const readyRes = await request(app.getHttpServer())
      .post(`/api/tickets/${ticketId}/ready`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    expect(notifySpy).toHaveBeenCalledTimes(3);
    expect(readyRes.body.data.status).toBe('ready');
    const savedTickets: Array<{ status: string }> = await dataSource.query(
      `SELECT status FROM order_ticket WHERE id = $1`,
      [ticketId],
    );
    expect(savedTickets[0]?.status).toBe('ready');

    notifySpy.mockRestore();
  });
});

function connect(
  port: number,
  credential: { token?: string; cookie?: string; origin?: string } = {},
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      origin: credential.origin ?? 'http://localhost:3000',
    };
    if (credential.cookie) headers.cookie = `access_token=${credential.cookie}`;
    const socket = io(`http://127.0.0.1:${port}/staff`, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 4_000,
      auth: credential.token ? { token: credential.token } : {},
      extraHeaders: headers,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => {
      socket.close();
      reject(error);
    });
  });
}

function once(socket: Socket, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), 4_000);
    socket.once(event, (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}
