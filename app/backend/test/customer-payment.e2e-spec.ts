import './set-auth-env.js';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CustomerPaymentSchema,
  CustomerPendingPaymentSchema,
  CustomerTabSchema,
  NotifyTransferResultSchema,
  TableListSchema,
  type CustomerPayment,
} from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { PaymentService } from '../src/modules/payment/application/payment.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { asGuest, openVisit, seatByLabel, startGuest, variantByName, waitFor } from './customer-fixtures.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

// BRIEF-052 AC tests — written by the planner against §3 before implementation (trial #36).
// The executor makes them pass without changing what they assert.
describe('Customer pay: PromptPay merge, แจ้งโอนแล้ว (e2e, BRIEF-052)', () => {
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
    await dataSource.query(`UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`);
  });

  it('AC-1: shows a zero bill to a seat-only phone and the tab total after an order', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const guest = await startGuest(app, seat.qr);
    expect(await paymentOf(guest)).toEqual({
      bill: { total: '0.00', paid: '0.00', remaining: '0.00', locked: false },
      pending: null,
    });

    await order(guest);
    const tab = CustomerTabSchema.parse((await asGuest(app, 'get', '/tab', guest).expect(200)).body.data);
    const payment = await paymentOf(guest);
    expect(payment.bill).toEqual({ total: tab.total, paid: '0.00', remaining: tab.total, locked: false });
    expect(payment.pending).toBeNull();
  });

  it('AC-2: creates one locked PromptPay payment for the remaining bill, owned by this phone', async () => {
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    const visitId = await order(guest);
    const events = await staffEvents();
    const remaining = (await paymentOf(guest)).bill.remaining;
    const key = randomUUID();

    const before = Date.now();
    const created = CustomerPendingPaymentSchema.parse((await pay(guest, key).expect(201)).body.data);
    expect(created).toMatchObject({ amount: remaining, mine: true });
    expect(created.qrPayload.length).toBeGreaterThan(0);
    const lifeMs = Date.parse(created.expiresAt) - before;
    expect(lifeMs).toBeGreaterThan(14 * 60_000);
    expect(lifeMs).toBeLessThanOrEqual(15 * 60_000 + 5_000);

    const rows: Array<Record<string, unknown>> = await dataSource.query(
      `SELECT p.guest_session_id, p.created_by, p.method, p.status, g.id AS session_id
       FROM payment p JOIN guest_session g ON g.visit_id = p.visit_id WHERE p.id = $1`,
      [created.id],
    );
    expect(rows[0]).toMatchObject({ created_by: null, method: 'promptpay', status: 'pending' });
    expect(rows[0]?.guest_session_id).toBe(rows[0]?.session_id);
    expect((await paymentOf(guest)).bill.locked).toBe(true);
    await waitFor(() => names(events).includes('payment.status_changed'), 'payment.status_changed');

    const replay = CustomerPendingPaymentSchema.parse((await pay(guest, key).expect(201)).body.data);
    expect(replay.id).toBe(created.id);
    expect(await countPayments(visitId)).toBe(1);
  });

  it('AC-3: never starts a second attempt — from another phone or over a POS payment', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const first = await startGuest(app, seat.qr);
    await order(first);
    const second = await startGuest(app, seat.qr);
    const created = CustomerPendingPaymentSchema.parse((await pay(first).expect(201)).body.data);

    expect((await pay(second).expect(409)).body.code).toBe('PAYMENT_IN_FLIGHT');
    expect((await paymentOf(second)).pending).toMatchObject({ id: created.id, mine: false });

    const other = await seatByLabel(dataSource, 'T2');
    const visitId = await staffOpen(other.id);
    await staffOrder(visitId);
    const posPaymentId = await staffPay(visitId);
    const guest = await startGuest(app, other.qr);
    expect((await pay(guest).expect(409)).body.code).toBe('PAYMENT_IN_FLIGHT');
    expect((await paymentOf(guest)).pending).toMatchObject({ id: posPaymentId, mine: false });
  });

  it('AC-4: refuses when there is nothing to pay or no PromptPay ID', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const seatOnly = await startGuest(app, seat.qr);
    expect((await pay(seatOnly).expect(409)).body.code).toBe('NOTHING_TO_PAY');

    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T2')).qr);
    await order(guest);
    await dataSource.query(`UPDATE venue SET promptpay_id = NULL, promptpay_id_type = NULL`);
    expect((await pay(guest).expect(409)).body.code).toBe('PROMPTPAY_NOT_SET');
  });

  it('AC-5: lets a phone cancel only its own pending payment', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const owner = await startGuest(app, seat.qr);
    await order(owner);
    const friend = await startGuest(app, seat.qr);
    const created = CustomerPendingPaymentSchema.parse((await pay(owner).expect(201)).body.data);

    expect((await cancel(friend, created.id).expect(403)).body.code).toBe('PAYMENT_NOT_YOURS');
    const after = CustomerPaymentSchema.parse((await cancel(owner, created.id).expect(200)).body.data);
    expect(after.pending).toBeNull();
    expect(after.bill.locked).toBe(false);
    expect(await statusOf(created.id)).toBe('cancelled');

    const other = await seatByLabel(dataSource, 'T2');
    const visitId = await staffOpen(other.id);
    await staffOrder(visitId);
    const posPaymentId = await staffPay(visitId);
    const guest = await startGuest(app, other.qr);
    expect((await cancel(guest, posPaymentId).expect(403)).body.code).toBe('PAYMENT_NOT_YOURS');

    const mine = CustomerPendingPaymentSchema.parse((await pay(owner).expect(201)).body.data);
    await markPaid(mine.id);
    expect((await cancel(owner, mine.id).expect(409)).body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('AC-6: แจ้งโอนแล้ว rings the seat bell with the amount and leaves the payment pending', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const guest = await startGuest(app, seat.qr);
    await order(guest);
    const created = CustomerPendingPaymentSchema.parse((await pay(guest).expect(201)).body.data);
    const events = await staffEvents();

    const result = NotifyTransferResultSchema.parse((await notify(guest, created.id).expect(200)).body.data);
    expect(Number.isNaN(Date.parse(result.notifiedAt))).toBe(false);
    const card = (await tables()).find((row) => row.id === seat.id);
    expect(card?.staffCall).toMatchObject({ reason: 'transfer', note: created.amount });
    await waitFor(() => names(events).includes('table.staff_called'), 'table.staff_called');
    expect(await statusOf(created.id)).toBe('pending');
    expect((await notify(guest, created.id).expect(429)).body.code).toBe('RATE_LIMITED');

    const other = await seatByLabel(dataSource, 'T2');
    const visitId = await staffOpen(other.id);
    await staffOrder(visitId);
    const posPaymentId = await staffPay(visitId);
    const friend = await startGuest(app, other.qr);
    await notify(friend, posPaymentId).expect(200);

    const third = await seatByLabel(dataSource, 'T3');
    const payer = await startGuest(app, third.qr);
    await order(payer);
    const paid = CustomerPendingPaymentSchema.parse((await pay(payer).expect(201)).body.data);
    await markPaid(paid.id);
    expect((await notify(payer, paid.id).expect(409)).body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('AC-7: the transfer bell clears when the payment is paid, cancelled or expires; a bill bell stays', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const guest = await startGuest(app, seat.qr);
    await order(guest);
    const events = await staffEvents();

    const paid = CustomerPendingPaymentSchema.parse((await pay(guest).expect(201)).body.data);
    await notify(guest, paid.id).expect(200);
    await markPaid(paid.id);
    expect((await tables()).find((row) => row.id === seat.id)?.staffCall).toBeNull();
    await waitFor(() => names(events).includes('table.staff_call_cleared'), 'table.staff_call_cleared');

    const second = await seatByLabel(dataSource, 'T2');
    const other = await startGuest(app, second.qr);
    await order(other);
    const cancelled = CustomerPendingPaymentSchema.parse((await pay(other).expect(201)).body.data);
    await notify(other, cancelled.id).expect(200);
    await cancel(other, cancelled.id).expect(200);
    expect((await tables()).find((row) => row.id === second.id)?.staffCall).toBeNull();

    const fourth = await seatByLabel(dataSource, 'T4');
    const late = await startGuest(app, fourth.qr);
    await order(late);
    const expiring = CustomerPendingPaymentSchema.parse((await pay(late).expect(201)).body.data);
    await notify(late, expiring.id).expect(200);
    // The 15-min job only acts on a payment that is due, so make it due and run the same entry point.
    await dataSource.query(`UPDATE payment SET expires_at = now() - interval '1 second' WHERE id = $1`, [expiring.id]);
    await app.get(PaymentService).expire(expiring.id);
    expect(await statusOf(expiring.id)).toBe('cancelled');
    expect((await tables()).find((row) => row.id === fourth.id)?.staffCall).toBeNull();

    const third = await seatByLabel(dataSource, 'T3');
    const caller = await startGuest(app, third.qr);
    await order(caller);
    await asGuest(app, 'post', '/call-staff', caller).send({ reason: 'bill' }).expect(201);
    const kept = CustomerPendingPaymentSchema.parse((await pay(caller).expect(201)).body.data);
    await markPaid(kept.id);
    expect((await tables()).find((row) => row.id === third.id)?.staffCall).toMatchObject({ reason: 'bill' });
  });

  it('AC-8: pings the phones when the payment is created and paid, then shows the bill settled', async () => {
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    const visitId = await order(guest);
    const pings = await guestPings(guest);

    const created = CustomerPendingPaymentSchema.parse((await pay(guest).expect(201)).body.data);
    await waitFor(() => pings.some((ping) => ping.visitId === visitId), 'tab.changed on create');
    const seen = pings.length;
    await markPaid(created.id);
    await waitFor(() => pings.length > seen, 'tab.changed on paid');

    const settled = await paymentOf(guest);
    expect(settled.bill.remaining).toBe('0.00');
    expect(settled.pending).toBeNull();
  });

  it('AC-9: keeps staff and guest auth apart, and guests cannot ring a transfer bell directly', async () => {
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    await order(guest);
    const created = CustomerPendingPaymentSchema.parse((await pay(guest).expect(201)).body.data);

    await request(app.getHttpServer())
      .get('/api/customer/payment')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/customer/payments')
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/mark-paid`)
      .set('Cookie', `guest_session=${guest}`)
      .send({ via: 'cash' })
      .expect(401);
    await asGuest(app, 'post', '/call-staff', guest).send({ reason: 'transfer' }).expect(400);
  });

  // ── helpers (same style as customer-order.e2e-spec.ts) ──

  async function order(cookie: string): Promise<string> {
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const response = await asGuest(app, 'post', '/orders', cookie)
      .send({ items: [{ variantId: beer.variantId, quantity: 2 }] })
      .expect(201);
    return response.body.data.visitId as string;
  }

  function pay(cookie: string, key: string = randomUUID()) {
    return asGuest(app, 'post', '/payments', cookie).set('Idempotency-Key', key).send({});
  }

  function cancel(cookie: string, paymentId: string) {
    return asGuest(app, 'post', `/payments/${paymentId}/cancel`, cookie).send({});
  }

  function notify(cookie: string, paymentId: string) {
    return asGuest(app, 'post', `/payments/${paymentId}/notify-transfer`, cookie).send({});
  }

  async function paymentOf(cookie: string): Promise<CustomerPayment> {
    const response = await asGuest(app, 'get', '/payment', cookie).expect(200);
    return CustomerPaymentSchema.parse(response.body.data);
  }

  async function staffOpen(tableSeatId: string): Promise<string> {
    const response = await openVisit(app, accessToken, tableSeatId).expect(201);
    return response.body.data.visit.id as string;
  }

  async function staffOrder(visitId: string): Promise<void> {
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ items: [{ variantId: beer.variantId, quantity: 1 }] })
      .expect(201);
  }

  async function staffPay(visitId: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set({ Authorization: `Bearer ${accessToken}`, 'Idempotency-Key': randomUUID() })
      .send({ method: 'promptpay', mode: 'merge' })
      .expect(201);
    return response.body.data.parts[0].id as string;
  }

  async function markPaid(paymentId: string): Promise<void> {
    await request(app.getHttpServer())
      .post(`/api/payments/${paymentId}/mark-paid`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ via: 'manual', reason: 'direct_transfer' })
      .expect(200);
  }

  async function tables() {
    const response = await request(app.getHttpServer())
      .get('/api/tables')
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);
    return TableListSchema.parse(response.body.data).items;
  }

  async function statusOf(paymentId: string): Promise<string> {
    const rows: Array<{ status: string }> = await dataSource.query(`SELECT status FROM payment WHERE id = $1`, [paymentId]);
    return rows[0]?.status ?? 'missing';
  }

  async function countPayments(visitId: string): Promise<number> {
    const rows: Array<{ n: string }> = await dataSource.query(`SELECT count(*) AS n FROM payment WHERE visit_id = $1`, [visitId]);
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

  async function guestPings(cookie: string): Promise<Array<{ visitId: string; sessionEnded?: boolean }>> {
    const pings: Array<{ visitId: string; sessionEnded?: boolean }> = [];
    const socket = await new Promise<Socket>((resolve, reject) => {
      const created = io(`http://127.0.0.1:${httpPort(app)}/customer`, {
        path: '/api/customer/socket.io',
        transports: ['websocket'],
        reconnection: false,
        timeout: 4_000,
        extraHeaders: { origin: 'http://localhost:3000', cookie: `guest_session=${cookie}` },
      });
      created.once('connect', () => resolve(created));
      created.once('connect_error', reject);
    });
    sockets.push(socket);
    socket.on('tab.changed', (payload: { visitId: string; sessionEnded?: boolean }) => pings.push(payload));
    return pings;
  }

  function names(events: Array<{ name: string }>): string[] {
    return events.map((event) => event.name);
  }
});
