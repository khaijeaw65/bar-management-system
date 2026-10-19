import './set-auth-env.js';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { PaymentService } from '../src/modules/payment/application/payment.service.js';
import { PAYMENT_EXPIRY_QUEUE } from '../src/modules/payment/application/payment.types.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const PROMPTPAY_1240 =
  '00020101021229370016A000000677010111011300668123456785802TH530376454071240.006304E975';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let staffId: string;
  const previousTtl = process.env.PAYMENT_QR_TTL_SECONDS;

  beforeAll(async () => {
    process.env.PAYMENT_QR_TTL_SECONDS = '2';
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
    process.env.PAYMENT_QR_TTL_SECONDS = previousTtl;
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    staffId = await insertStaff(dataSource, 'แคชเชียร์');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(
      `UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`,
    );
  });

  it('locks a 1240 promptpay bill, links the order, and queues expiry', async () => {
    const visitId = await openSeat('T3');
    await priceAt(await placeBeer(visitId), '1240.00');
    const socket = await connect();
    const event = once(socket, 'payment.status_changed');
    const created = await pay(visitId, 'promptpay');
    const part = created.body.data.parts[0];

    expect(created.body.data).toMatchObject({ mode: 'merge', total: '1240.00' });
    expect(part).toMatchObject({
      status: 'pending',
      amount: '1240.00',
      method: 'promptpay',
      qrPayload: PROMPTPAY_1240,
      partNo: 1,
      partCount: 1,
    });
    expect(Date.parse(part.expiresAt) - Date.now()).toBeGreaterThan(0);
    expect(Date.parse(part.expiresAt) - Date.now()).toBeLessThanOrEqual(3_000);
    const links: Array<{ order_id: string }> = await dataSource.query(
      `SELECT order_id FROM payment_order WHERE payment_id = $1`,
      [part.id],
    );
    expect(links).toHaveLength(1);
    expect(await app.get(RedisService).client.exists(`bull:${PAYMENT_EXPIRY_QUEUE}:${part.id}`)).toBe(1);
    expect(await event).toMatchObject({ paymentId: part.id, status: 'pending', amount: '1240.00' });
    socket.close();
  });

  describe('lock', () => {
    it('blocks a second create and close, and keeps a later order due', async () => {
      const visitId = await openSeat('T3');
      const firstOrder = await placeBeer(visitId);
      const pending = await pay(visitId, 'promptpay');
      const again = await pay(visitId, 'promptpay', false);
      expect(again.status).toBe(409);
      expect(again.body.code).toBe('PAYMENT_IN_FLIGHT');
      expect(again.body.data.details.attemptId).toBe(pending.body.data.attemptId);

      const closed = await request(app.getHttpServer()).post(`/api/visits/${visitId}/close`).set(auth());
      expect(closed.status).toBe(409);
      expect(closed.body.code).toBe('PAYMENT_IN_FLIGHT');

      const later = await placeBeer(visitId);
      expect(later).not.toBe(firstOrder);
      await request(app.getHttpServer())
        .post(`/api/payments/${pending.body.data.parts[0].id}/mark-paid`)
        .set(auth())
        .send({ via: 'cash' })
        .expect(200);
      const visit = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
      expect(visit.body.data.bill.remaining).toBe('120.00');
      expect(visit.body.data.bill.locked).toBe(false);
    });

    it('replays the same idempotency key and rejects a different body', async () => {
      const visitId = await openSeat('T1');
      await placeBeer(visitId);
      const key = randomUUID();
      const first = await pay(visitId, 'cash', true, key);
      const second = await pay(visitId, 'cash', true, key);
      expect(second.body.data.attemptId).toBe(first.body.data.attemptId);
      const other = await pay(visitId, 'promptpay', false, key);
      expect(other.status).toBe(409);
      expect(other.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
    });

    it('lets one of two concurrent creates win', async () => {
      const visitId = await openSeat('T2');
      await placeBeer(visitId);
      const [left, right] = await Promise.all([
        pay(visitId, 'promptpay', false),
        pay(visitId, 'promptpay', false),
      ]);
      const statuses = [left.status, right.status].sort();
      expect(statuses).toEqual([201, 409]);
      expect([left, right].find((response) => response.status === 409)?.body.code).toBe('PAYMENT_IN_FLIGHT');
    });

    it('lets one of mark-paid and cancel win', async () => {
      const visitId = await openSeat('T4');
      await placeBeer(visitId);
      const id = (await pay(visitId, 'promptpay')).body.data.parts[0].id as string;
      const [paid, cancelled] = await Promise.all([
        request(app.getHttpServer()).post(`/api/payments/${id}/mark-paid`).set(auth()).send({ via: 'cash' }),
        request(app.getHttpServer()).post(`/api/payments/${id}/cancel`).set(auth()),
      ]);
      const statuses = [paid.status, cancelled.status].sort();
      expect(statuses).toEqual([200, 409]);
      expect([paid, cancelled].find((response) => response.status === 409)?.body.code).toBe(
        'INVALID_STATE_TRANSITION',
      );
    });
  });

  it('completes cash immediately and can settle a QR as cash', async () => {
    const visitId = await openSeat('T5');
    await placeBeer(visitId);
    const cash = await pay(visitId, 'cash');
    expect(cash.body.data.parts[0]).toMatchObject({ status: 'completed', confirmedVia: 'cash', qrPayload: null });
    expect(await jobCount(cash.body.data.parts[0].id)).toBe(0);

    const qrVisit = await openSeat('T6');
    await placeBeer(qrVisit);
    const id = (await pay(qrVisit, 'promptpay')).body.data.parts[0].id as string;
    const settled = await request(app.getHttpServer())
      .post(`/api/payments/${id}/mark-paid`)
      .set(auth())
      .send({ via: 'cash' })
      .expect(200);
    expect(settled.body.data).toMatchObject({ status: 'completed', confirmedVia: 'cash' });
    expect(await jobCount(id)).toBe(0);
  });

  it('requires a manual reason and stores the staff member', async () => {
    const visitId = await openSeat('C1');
    await placeBeer(visitId);
    const id = (await pay(visitId, 'promptpay')).body.data.parts[0].id as string;
    const missing = await request(app.getHttpServer())
      .post(`/api/payments/${id}/mark-paid`)
      .set(auth())
      .send({ via: 'manual' });
    expect(missing.status).toBe(400);
    const other = await request(app.getHttpServer())
      .post(`/api/payments/${id}/mark-paid`)
      .set(auth())
      .send({ via: 'manual', reason: 'other' });
    expect(other.status).toBe(400);
    const paid = await request(app.getHttpServer())
      .post(`/api/payments/${id}/mark-paid`)
      .set(auth())
      .send({ via: 'manual', reason: 'other', note: 'โอนตรง' })
      .expect(200);
    expect(paid.body.data).toMatchObject({
      status: 'completed',
      confirmedVia: 'manual',
      statusReason: 'other',
      statusNote: 'โอนตรง',
      updatedBy: staffId,
    });
    const again = await request(app.getHttpServer())
      .post(`/api/payments/${id}/mark-paid`)
      .set(auth())
      .send({ via: 'cash' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('cancels a pending payment and refuses a completed one', async () => {
    const visitId = await openSeat('T1');
    await placeBeer(visitId);
    const id = (await pay(visitId, 'promptpay')).body.data.parts[0].id as string;
    const cancelled = await request(app.getHttpServer()).post(`/api/payments/${id}/cancel`).set(auth()).expect(200);
    expect(cancelled.body.data).toMatchObject({ status: 'cancelled', statusReason: 'staff_cancel' });
    const visit = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
    expect(visit.body.data.bill.locked).toBe(false);
    expect(await jobCount(id)).toBe(0);

    const cashId = (await pay(visitId, 'cash')).body.data.parts[0].id as string;
    const refused = await request(app.getHttpServer()).post(`/api/payments/${cashId}/cancel`).set(auth());
    expect(refused.status).toBe(409);
  });

  it('does not close the visit when the bill is settled', async () => {
    const visitId = await openSeat('T2');
    await placeBeer(visitId);
    await pay(visitId, 'cash');
    const stillOpen = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
    expect(stillOpen.body.data.state).not.toBe('closed');
    expect(stillOpen.body.data.bill.remaining).toBe('0.00');
    const closed = await request(app.getHttpServer()).post(`/api/visits/${visitId}/close`).set(auth()).expect(200);
    expect(closed.body.data.state).toBe('closed');
  });

  it('rejects gateway mode, a missing PromptPay id, and a mode other than merge', async () => {
    const visitId = await openSeat('T3');
    await placeBeer(visitId);
    await dataSource.query(`UPDATE venue SET payment_mode = 'gateway'`);
    const gateway = await pay(visitId, 'cash', false);
    expect(gateway.body.code).toBe('PAYMENT_MODE_UNAVAILABLE');

    await dataSource.query(`UPDATE venue SET payment_mode = 'own_promptpay', promptpay_id = NULL`);
    const missing = await pay(visitId, 'promptpay', false);
    expect(missing.body.code).toBe('PROMPTPAY_NOT_SET');
    const cash = await pay(visitId, 'cash');
    expect(cash.status).toBe(201);

    const again = await openSeat('T4');
    await placeBeer(again);
    const badMode = await request(app.getHttpServer())
      .post(`/api/visits/${again}/payments`)
      .set(auth())
      .send({ method: 'cash', mode: 'split_equal' });
    expect(badMode.status).toBe(400);
    expect(badMode.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 and 400 for unknown ids and a bad body', async () => {
    const missing = await request(app.getHttpServer()).get(`/api/payments/${UNKNOWN}`).set(auth());
    expect(missing.status).toBe(404);
    const visitId = await openSeat('T5');
    const bad = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set(auth())
      .send({ method: 'cash' });
    expect(bad.status).toBe(400);
    const empty = await pay(visitId, 'cash', false);
    expect(empty.body.code).toBe('NOTHING_TO_PAY');
  });

  it('shows paymentPending on the table card', async () => {
    const visitId = await openSeat('T1');
    await placeBeer(visitId);
    await pay(visitId, 'promptpay');
    const tables = await request(app.getHttpServer()).get('/api/tables').set(auth()).expect(200);
    const seat = tables.body.data.items.find((item: { label: string }) => item.label === 'T1');
    expect(seat.currentVisit.paymentPending).toBe(true);
  });

  describe('expiry', () => {
    it('cancels an untouched payment from the delayed job and ignores a settled one', async () => {
      const visitId = await openSeat('T6');
      await placeBeer(visitId);
      const socket = await connect();
      const events: unknown[] = [];
      socket.on('payment.status_changed', (payload) => events.push(payload));
      const id = (await pay(visitId, 'promptpay')).body.data.parts[0].id as string;
      const cancelled = await waitUntilCancelled(id);
      expect(cancelled).toMatchObject({ status: 'cancelled', statusReason: 'expired' });
      const expiredEvents = events.filter((event) => (event as { status?: string }).status === 'cancelled');
      expect(expiredEvents).toHaveLength(1);
      const visit = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
      expect(visit.body.data.bill.locked).toBe(false);

      const settledVisit = await openSeat('T5');
      await placeBeer(settledVisit);
      const settledId = (await pay(settledVisit, 'promptpay')).body.data.parts[0].id as string;
      await request(app.getHttpServer())
        .post(`/api/payments/${settledId}/mark-paid`)
        .set(auth())
        .send({ via: 'cash' })
        .expect(200);
      const before = events.length;
      await app.get(PaymentService).expire(settledId);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(events.length).toBe(before);
      socket.close();
    });

    it('lets expire and mark-paid race to a single winner', async () => {
      const visitId = await openSeat('C1');
      await placeBeer(visitId);
      const socket = await connect();
      const events: unknown[] = [];
      socket.on('payment.status_changed', (payload) => events.push(payload));
      const id = (await pay(visitId, 'promptpay')).body.data.parts[0].id as string;
      await dataSource.query(`UPDATE payment SET expires_at = now() - interval '1 second' WHERE id = $1`, [id]);
      const job = await queue().getJob(id);
      await job?.remove();
      const before = events.length;
      const [expired, paid] = await Promise.all([
        app.get(PaymentService).expire(id),
        request(app.getHttpServer()).post(`/api/payments/${id}/mark-paid`).set(auth()).send({ via: 'manual', reason: 'direct_transfer' }),
      ]);
      expect(expired).toBeUndefined();
      const row: Array<{ status: string }> = await dataSource.query(`SELECT status FROM payment WHERE id = $1`, [id]);
      expect(['completed', 'cancelled']).toContain(row[0]?.status);
      if (row[0]?.status === 'cancelled') expect(paid.status).toBe(409);
      if (row[0]?.status === 'completed') expect(paid.status).toBe(200);
      expect(events.length - before).toBe(1);
      socket.close();
    });
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function queue(): Queue {
    return app.get<Queue>(getQueueToken(PAYMENT_EXPIRY_QUEUE));
  }

  async function jobCount(paymentId: string): Promise<number> {
    return app.get(RedisService).client.exists(`bull:${PAYMENT_EXPIRY_QUEUE}:${paymentId}`);
  }

  async function openSeat(label: string): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(`SELECT id FROM table_seat WHERE label = $1`, [label]);
    const response = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    return response.body.data.visit.id as string;
  }

  async function placeBeer(visitId: string): Promise<string> {
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v
       JOIN menu_item i ON i.id = v.menu_item_id
       WHERE i.name = 'ช้างดราฟต์' AND v.name = 'ปกติ'`,
    );
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);
    return response.body.data.id as string;
  }

  async function priceAt(orderId: string, amount: string): Promise<void> {
    await dataSource.query(
      `UPDATE order_item SET unit_price_snapshot = $2
       WHERE ticket_id IN (SELECT id FROM order_ticket WHERE order_id = $1)`,
      [orderId, amount],
    );
  }

  async function pay(
    visitId: string,
    method: 'promptpay' | 'cash',
    expectCreated = true,
    key?: string,
  ): Promise<request.Response> {
    const headers = key ? { ...auth(), 'Idempotency-Key': key } : auth();
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set(headers)
      .send({ method, mode: 'merge' });
    if (expectCreated) expect(response.status).toBe(201);
    return response;
  }

  async function waitUntilCancelled(id: string): Promise<{ status: string; statusReason: string }> {
    const deadline = Date.now() + 8_000;
    while (Date.now() < deadline) {
      const response = await request(app.getHttpServer()).get(`/api/payments/${id}`).set(auth()).expect(200);
      if (response.body.data.status === 'cancelled') return response.body.data;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('payment did not expire');
  }

  function connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = io(`http://127.0.0.1:${httpPort(app)}/staff`, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 4_000,
        auth: { token: accessToken },
        extraHeaders: { origin: 'http://localhost:3000' },
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
});
