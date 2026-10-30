import './set-auth-env.js';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CallStaffResultSchema,
  CustomerPlaceOrderResultSchema,
  CustomerTabSchema,
  TableListSchema,
  type CustomerTab,
  type Order,
} from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { asGuest, openVisit, seatByLabel, startGuest, variantByName, waitFor } from './customer-fixtures.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

describe('Customer order, tab and call staff (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
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
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    accessToken = (await staffSession(app, await insertStaff(dataSource, 'Owner'))).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('opens the visit on the first order of a seat-only session (AC-1)', async () => {
    const events = await staffEvents();
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');

    const sent = await send(guest, [{ variantId: beer.variantId, quantity: 2 }]).expect(201);
    const result = CustomerPlaceOrderResultSchema.parse(sent.body.data);

    const visits: Array<Record<string, unknown>> = await dataSource.query(`SELECT * FROM visit WHERE id = $1`, [result.visitId]);
    expect(visits[0]).toMatchObject({ opened_via: 'qr', opened_by: null, state: 'active' });
    const sessions: Array<{ id: string; visit_id: string }> = await dataSource.query(`SELECT id, visit_id FROM guest_session`);
    expect(sessions[0]?.visit_id).toBe(result.visitId);
    const orders: Array<Record<string, unknown>> = await dataSource.query(`SELECT * FROM order_record WHERE id = $1`, [result.orderId]);
    expect(orders[0]).toMatchObject({ guest_session_id: sessions[0]?.id, created_by: null, visit_id: result.visitId });

    await waitFor(() => names(events).includes('order.created') && names(events).includes('visit.opened'), 'staff events');
  });

  it('settles a race with the POS on one live visit (AC-2)', async () => {
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    for (const label of ['T2', 'T3', 'T4']) {
      const seat = await seatByLabel(dataSource, label);
      const guest = await startGuest(app, seat.qr);
      const [pos, phone] = await Promise.all([
        openVisit(app, accessToken, seat.id),
        send(guest, [{ variantId: beer.variantId, quantity: 1 }]),
      ]);
      expect(pos.status).toBeLessThan(300);
      expect(phone.status).toBe(201);
      const live: Array<{ id: string }> = await dataSource.query(
        `SELECT id FROM visit WHERE table_seat_id = $1 AND state IN ('open','active','idle')`,
        [seat.id],
      );
      expect(live).toHaveLength(1);
      expect(phone.body.data.visitId).toBe(live[0]?.id);
      const bound: Array<{ visit_id: string }> = await dataSource.query(`SELECT visit_id FROM guest_session WHERE table_seat_id = $1`, [seat.id]);
      expect(bound[0]?.visit_id).toBe(live[0]?.id);
    }
  });

  it('shares one tab between phones and marks only mine (AC-3, AC-6)', async () => {
    const seat = await seatByLabel(dataSource, 'T5');
    const visitId = (await openVisit(app, accessToken, seat.id).expect(201)).body.data.visit.id as string;
    const phoneA = await startGuest(app, seat.qr);
    const phoneB = await startGuest(app, seat.qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const nuts = await variantByName(dataSource, 'ถั่วทอดสมุนไพร');
    const charge = await variantByName(dataSource, 'ค่าเปิดขวด');
    await asGuest(app, 'patch', '/session', phoneA).send({ displayName: 'เอก' }).expect(200);

    await send(phoneA, [{ variantId: beer.variantId, quantity: 1 }]).expect(201);
    await send(phoneB, [{ variantId: nuts.variantId, quantity: 1 }]).expect(201);
    const staffOrder = await staffPlace(visitId, [
      { variantId: beer.variantId, quantity: 2 },
      { variantId: charge.variantId, quantity: 1 },
    ]);
    const bar = staffOrder.tickets.find((ticket) => ticket.station === 'bar');
    await request(app.getHttpServer())
      .post(`/api/tickets/${bar?.id}/accept`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);

    const tabA = await tabOf(phoneA);
    expect(tabA.visitId).toBe(visitId);
    expect(tabA.orders).toHaveLength(3);
    expect(tabA.orders.map((order) => order.mine)).toEqual([false, false, true]);
    expect(tabA.orders.map((order) => order.orderNumber)).toEqual(tabA.orders.map((order) => order.orderNumber).sort((a, b) => b - a));
    const staffEntry = tabA.orders[0];
    expect(staffEntry?.tickets).toEqual([{ station: 'bar', status: 'accepted' }]);
    expect(staffEntry?.lines.map((line) => line.itemName)).toEqual(expect.arrayContaining(['ค่าเปิดขวด']));
    expect(tabA.orders[2]?.lines[0]).toMatchObject({ orderedByName: 'เอก', itemName: 'ช้างดราฟต์' });
    expect(tabA.orders[1]?.lines[0]?.orderedByName).toBeNull();
    expect((await tabOf(phoneB)).orders.map((order) => order.mine)).toEqual([false, true, false]);

    const text = JSON.stringify(tabA);
    expect(text).not.toContain('Owner');
    const sessionIds: Array<{ id: string }> = await dataSource.query(`SELECT id FROM guest_session`);
    for (const row of sessionIds) expect(text).not.toContain(row.id);
  });

  it('replays one key, spaces orders 10 s apart, and refuses sold-out and charge lines (AC-4)', async () => {
    const seat = await seatByLabel(dataSource, 'T6');
    const guest = await startGuest(app, seat.qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const key = randomUUID();

    const first = await send(guest, [{ variantId: beer.variantId, quantity: 1 }], key).expect(201);
    const replay = await send(guest, [{ variantId: beer.variantId, quantity: 1 }], key).expect(201);
    expect(replay.body.data.orderId).toBe(first.body.data.orderId);
    expect(await count('order_record')).toBe(1);

    const tooSoon = await send(guest, [{ variantId: beer.variantId, quantity: 1 }]).expect(429);
    expect(tooSoon.body.code).toBe('RATE_LIMITED');

    const other = await startGuest(app, (await seatByLabel(dataSource, 'C1')).qr);
    await dataSource.query(`UPDATE menu_item SET is_available = false WHERE id = $1`, [beer.itemId]);
    const soldOut = await send(other, [{ variantId: beer.variantId, quantity: 1 }]).expect(409);
    expect(soldOut.body.code).toBe('ITEM_UNAVAILABLE');
    expect(soldOut.body.data.details).toEqual([{ variantId: beer.variantId, reason: 'sold_out' }]);
    expect(await count('visit')).toBe(1);
    await dataSource.query(`UPDATE menu_item SET is_available = true WHERE id = $1`, [beer.itemId]);

    // A refused order gives the slot back, so fixing the cart does not cost another 10 s.
    const charge = await variantByName(dataSource, 'ค่าเปิดขวด');
    const refused = await send(other, [{ variantId: charge.variantId, quantity: 1 }]).expect(400);
    expect(refused.body.code).toBe('VALIDATION_ERROR');
    await send(other, [{ variantId: beer.variantId, quantity: 1 }]).expect(201);
    expect(await count('visit')).toBe(2);
  });

  it('ignores orderedByName from the body and freezes the nickname per line (AC-5)', async () => {
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    await asGuest(app, 'patch', '/session', guest).send({ displayName: 'เอก' }).expect(200);

    await send(guest, [{ variantId: beer.variantId, quantity: 1, orderedByName: 'เจ้าของร้าน' }]).expect(201);
    await asGuest(app, 'patch', '/session', guest).send({ displayName: 'บี' }).expect(200);

    const lines: Array<{ ordered_by_name: string }> = await dataSource.query(`SELECT ordered_by_name FROM order_item`);
    expect(lines.map((line) => line.ordered_by_name)).toEqual(['เอก']);
    expect((await tabOf(guest)).orders[0]?.lines[0]?.orderedByName).toBe('เอก');
  });

  it('returns an empty tab for a seat-only session', async () => {
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    const tab = await tabOf(guest);
    expect(tab).toMatchObject({ visitId: null, orders: [], total: '0.00' });
  });

  it('keeps cancelled lines struck and out of the total (AC-6)', async () => {
    const seat = await seatByLabel(dataSource, 'T5');
    const guest = await startGuest(app, seat.qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const nuts = await variantByName(dataSource, 'ถั่วทอดสมุนไพร');
    await send(guest, [
      { variantId: beer.variantId, quantity: 1 },
      { variantId: nuts.variantId, quantity: 1 },
    ]).expect(201);
    const before = await tabOf(guest);

    await request(app.getHttpServer())
      .post(`/api/menu/items/${nuts.itemId}/mark-unavailable`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);

    const after = await tabOf(guest);
    const cancelled = after.orders[0]?.lines.filter((line) => line.cancelled) ?? [];
    expect(cancelled.map((line) => line.itemName)).toEqual(['ถั่วทอดสมุนไพร']);
    expect(Number(after.total)).toBeLessThan(Number(before.total));
    expect(after.total).toBe(
      after.orders[0]?.lines.filter((line) => !line.cancelled).reduce((sum, line) => sum + Number(line.lineTotal), 0).toFixed(2),
    );
  });

  it('rings the bell from a seat-only session and lets staff clear it (AC-7)', async () => {
    const events = await staffEvents();
    const seat = await seatByLabel(dataSource, 'T3');
    const guest = await startGuest(app, seat.qr);

    const called = await asGuest(app, 'post', '/call-staff', guest).send({ reason: 'bill', note: 'เช็คบิลค่ะ' }).expect(201);
    CallStaffResultSchema.parse(called.body.data);
    await waitFor(() => names(events).includes('table.staff_called'), 'staff_called');
    expect(events.find((event) => event.name === 'table.staff_called')?.payload).toMatchObject({
      tableSeatId: seat.id,
      reason: 'bill',
      note: 'เช็คบิลค่ะ',
    });
    const limited = await asGuest(app, 'post', '/call-staff', guest).send({}).expect(429);
    expect(limited.body.code).toBe('RATE_LIMITED');

    const card = (await tables()).find((item) => item.id === seat.id);
    expect(card?.staffCall).toMatchObject({ reason: 'bill', note: 'เช็คบิลค่ะ' });

    await acknowledge(seat.id).expect(200);
    await waitFor(() => names(events).includes('table.staff_call_cleared'), 'staff_call_cleared');
    expect((await tables()).find((item) => item.id === seat.id)?.staffCall).toBeNull();
    await acknowledge(seat.id).expect(200);
  });

  it('shows staffCalled on the visit card and clears the bell when the visit closes (AC-7)', async () => {
    const seat = await seatByLabel(dataSource, 'T2');
    const visitId = (await openVisit(app, accessToken, seat.id).expect(201)).body.data.visit.id as string;
    const guest = await startGuest(app, seat.qr);
    await asGuest(app, 'post', '/call-staff', guest).send({}).expect(201);
    const card = (await tables()).find((item) => item.id === seat.id);
    expect(card?.currentVisit?.staffCalled).toBe(true);
    expect(card?.staffCall).toMatchObject({ reason: null, note: null });

    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);
    expect((await tables()).find((item) => item.id === seat.id)?.staffCall).toBeNull();
  });

  it('keeps the two audiences apart (AC-9)', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const staffTry = await request(app.getHttpServer())
      .post('/api/customer/orders')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ items: [{ variantId: beer.variantId, quantity: 1 }] });
    expect(staffTry.status).toBe(401);
    expect(staffTry.body.code).toBe('GUEST_SESSION_INVALID');

    const guest = await startGuest(app, seat.qr);
    const guestTry = await request(app.getHttpServer())
      .post(`/api/tables/${seat.id}/acknowledge-call`)
      .set('Cookie', `guest_session=${guest}`);
    expect(guestTry.status).toBe(401);
  });

  function send(cookie: string, items: unknown[], key?: string) {
    const call = asGuest(app, 'post', '/orders', cookie);
    if (key) call.set('Idempotency-Key', key);
    return call.send({ items });
  }

  async function tabOf(cookie: string): Promise<CustomerTab> {
    const response = await asGuest(app, 'get', '/tab', cookie).expect(200);
    return CustomerTabSchema.parse(response.body.data);
  }

  async function staffPlace(visitId: string, items: unknown[]): Promise<Order> {
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ items })
      .expect(201);
    return response.body.data as Order;
  }

  async function tables() {
    const response = await request(app.getHttpServer())
      .get('/api/tables')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);
    return TableListSchema.parse(response.body.data).items;
  }

  function acknowledge(seatId: string) {
    return request(app.getHttpServer())
      .post(`/api/tables/${seatId}/acknowledge-call`)
      .set({ Authorization: `Bearer ${accessToken}` });
  }

  async function count(table: 'order_record' | 'visit'): Promise<number> {
    const rows: Array<{ n: string }> = await dataSource.query(`SELECT count(*) AS n FROM ${table}`);
    return Number(rows[0]?.n ?? 0);
  }

  async function staffEvents(): Promise<Array<{ name: string; payload: unknown }>> {
    const events: Array<{ name: string; payload: unknown }> = [];
    const socket = await new Promise<Socket>((resolve, reject) => {
      const created = io(`http://127.0.0.1:${httpPort(app)}/staff`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token: accessToken },
        extraHeaders: { origin: 'http://localhost:3000' },
      });
      created.once('connect', () => resolve(created));
      created.once('connect_error', reject);
    });
    sockets.push(socket);
    socket.onAny((name: string, payload: unknown) => events.push({ name, payload }));
    return events;
  }

  function names(events: Array<{ name: string }>): string[] {
    return events.map((event) => event.name);
  }
});
