import './set-auth-env.js';
import { Injectable, type INestApplication } from '@nestjs/common';
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
import { PAYMENT_EXPIRY_QUEUE } from '../src/modules/payment/application/payment.types.js';
import {
  SlipVerifier,
  type SlipVerifyResult,
} from '../src/modules/payment/domain/ports/slip-verifier.port.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');

@Injectable()
class ScriptedSlipVerifier implements SlipVerifier {
  public next: SlipVerifyResult = { kind: 'unavailable' };
  public calls = 0;

  public async verify(): Promise<SlipVerifyResult> {
    this.calls += 1;
    return this.next;
  }
}

function verified(amount: string, receiverMatch: 'matched' | 'not_matched' | 'unknown' = 'matched', transRef = 'REF-1305'): SlipVerifyResult {
  return { kind: 'verified', transRef, amount, receiverMatch };
}

describe('Payment slip verification (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SlipVerifier)
      .useClass(ScriptedSlipVerifier)
      .compile();
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
    const staffId = await insertStaff(dataSource, 'แคชเชียร์');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(`UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`);
    const slips = verifier();
    slips.calls = 0;
    slips.next = { kind: 'unavailable' };
  });

  it('completes a matched slip, stores the amount, and drops the expiry job', async () => {
    const id = await pendingBill('T1', '1305.00');
    verifier().next = verified('1305.00');
    const socket = await connect();
    const event = once(socket, 'payment.status_changed');
    const paid = await verify(id, { payload: 'QR-1305' });
    expect(paid.status).toBe(200);
    expect(paid.body.data).toMatchObject({
      status: 'completed',
      confirmedVia: 'slip_verify',
      slipAmount: '1305.00',
      slipTransRef: 'REF-1305',
    });
    expect(await jobCount(id)).toBe(0);
    expect(await event).toMatchObject({ paymentId: id, status: 'completed', confirmedVia: 'slip_verify' });
    expect(await rejects(id)).toHaveLength(0);
    socket.close();
  });

  it('accepts a jpeg image and rejects a bad body', async () => {
    const id = await pendingBill('T2', '1305.00');
    verifier().next = verified('1305.00', 'matched', 'REF-IMG');
    const paid = await verify(id, { image: JPEG });
    expect(paid.status).toBe(200);
    expect(paid.body.data.slipTransRef).toBe('REF-IMG');

    const other = await pendingBill('T3', '80.00');
    const text = Buffer.from('hello').toString('base64');
    expect((await verify(other, { image: text })).status).toBe(400);
    expect((await verify(other, {})).status).toBe(400);
    expect((await verify(other, { payload: 'QR', image: JPEG })).status).toBe(400);
    const huge = Buffer.alloc(1_048_577);
    huge[0] = 0xff;
    huge[1] = 0xd8;
    huge[2] = 0xff;
    const oversized = await verify(other, { image: huge.toString('base64') });
    expect(oversized.status).toBe(400);
    expect(oversized.body.code).toBe('VALIDATION_ERROR');
    expect(verifier().calls).toBe(1);
  });

  it('accepts an overpayment and rejects a short one', async () => {
    const overId = await pendingBill('T4', '1305.00');
    verifier().next = verified('1400.00', 'matched', 'REF-OVER');
    const over = await verify(overId, { payload: 'QR-OVER' });
    expect(over.body.data).toMatchObject({ status: 'completed', slipAmount: '1400.00' });

    const shortId = await pendingBill('T5', '1305.00');
    verifier().next = verified('1200.00', 'matched', 'REF-SHORT');
    const short = await verify(shortId, { payload: 'QR-SHORT' });
    expect(short.status).toBe(422);
    expect(short.body.code).toBe('SLIP_AMOUNT_SHORT');
    expect(await statusOf(shortId)).toBe('pending');
  });

  it('rejects a reused reference and lets one of two concurrent scans win', async () => {
    const first = await pendingBill('T6', '1305.00');
    verifier().next = verified('1305.00', 'matched', 'REF-ONCE');
    expect((await verify(first, { payload: 'QR-ONCE' })).status).toBe(200);
    const second = await pendingBill('C1', '1305.00');
    const again = await verify(second, { payload: 'QR-ONCE' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('SLIP_ALREADY_USED');
    expect(await statusOf(second)).toBe('pending');
    expect(await rejects(second)).toHaveLength(1);

    const left = await pendingBill('T1', '90.00');
    const right = await pendingBill('T2', '90.00');
    verifier().next = verified('90.00', 'matched', 'REF-RACE');
    const [one, two] = await Promise.all([
      verify(left, { payload: 'QR-RACE' }),
      verify(right, { payload: 'QR-RACE' }),
    ]);
    const statuses = [one.status, two.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect([one, two].find((item) => item.status === 409)?.body.code).toBe('SLIP_ALREADY_USED');
    const winners = [await statusOf(left), await statusOf(right)].filter((status) => status === 'completed');
    expect(winners).toHaveLength(1);
  });

  it('records a rejection with no names for each slip failure', async () => {
    const cases: Array<{ next: SlipVerifyResult; status: number; code: string }> = [
      { next: verified('1305.00', 'not_matched', 'REF-NO'), status: 422, code: 'SLIP_WRONG_RECEIVER' },
      { next: verified('1305.00', 'unknown', 'REF-UNCLEAR'), status: 422, code: 'SLIP_RECEIVER_UNCLEAR' },
      { next: { kind: 'invalid' }, status: 422, code: 'SLIP_INVALID' },
      { next: { kind: 'pending' }, status: 409, code: 'SLIP_PENDING' },
      { next: { kind: 'unavailable' }, status: 503, code: 'SLIP_SERVICE_UNAVAILABLE' },
    ];
    const seats = ['T1', 'T2', 'T3', 'T4', 'T5'] as const;
    for (const [index, item] of cases.entries()) {
      const seat = seats[index];
      if (!seat) throw new Error('missing seat');
      const id = await pendingBill(seat, '1305.00');
      verifier().calls = 0;
      verifier().next = item.next;
      const response = await verify(id, { payload: `QR-${item.code}` });
      expect(response.status).toBe(item.status);
      expect(response.body.code).toBe(item.code);
      expect(await statusOf(id)).toBe('pending');
      const rows = await rejects(id);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.action).toBe('REJECT');
      expect(String(rows[0]?.fields)).not.toMatch(/sender|receiver|นาย|บริษัท/);
    }
  });

  it('does not call the verifier unless the payment is a pending PromptPay', async () => {
    const cashVisit = await openSeat('T6');
    await placeBeer(cashVisit);
    const cashId = (await pay(cashVisit, 'cash')).body.data.parts[0].id as string;
    verifier().calls = 0;
    const cash = await verify(cashId, { payload: 'QR' });
    expect(cash.status).toBe(409);
    expect(cash.body.code).toBe('INVALID_STATE_TRANSITION');

    const pendingId = await pendingBill('C1', '50.00');
    await request(app.getHttpServer()).post(`/api/payments/${pendingId}/cancel`).set(auth()).expect(200);
    const cancelled = await verify(pendingId, { payload: 'QR' });
    expect(cancelled.body.code).toBe('INVALID_STATE_TRANSITION');

    const doneId = await pendingBill('T1', '50.00');
    await request(app.getHttpServer())
      .post(`/api/payments/${doneId}/mark-paid`)
      .set(auth())
      .send({ via: 'cash' })
      .expect(200);
    const completed = await verify(doneId, { payload: 'QR' });
    expect(completed.body.code).toBe('INVALID_STATE_TRANSITION');

    const expiredId = await pendingBill('T2', '50.00');
    await dataSource.query(
      `UPDATE payment SET status = 'cancelled', status_reason = 'expired' WHERE id = $1`,
      [expiredId],
    );
    const expired = await verify(expiredId, { payload: 'QR' });
    expect(expired.body.code).toBe('INVALID_STATE_TRANSITION');

    const methodId = await pendingBill('T3', '50.00');
    await dataSource.query(`UPDATE payment SET method = 'cash' WHERE id = $1`, [methodId]);
    const method = await verify(methodId, { payload: 'QR' });
    expect(method.body.code).toBe('INVALID_STATE_TRANSITION');
    expect(verifier().calls).toBe(0);
  });

  function verifier(): ScriptedSlipVerifier {
    return app.get(SlipVerifier);
  }

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function queue(): Queue {
    return app.get<Queue>(getQueueToken(PAYMENT_EXPIRY_QUEUE));
  }

  async function jobCount(paymentId: string): Promise<number> {
    const job = await queue().getJob(paymentId);
    return job ? 1 : 0;
  }

  async function rejects(paymentId: string): Promise<Array<{ action: string; fields: string }>> {
    return dataSource.query(
      `SELECT action, changed_fields::text AS fields FROM audit_log
       WHERE entity = 'payment' AND entity_id = $1 AND action = 'REJECT'`,
      [paymentId],
    );
  }

  async function statusOf(paymentId: string): Promise<string> {
    const response = await request(app.getHttpServer()).get(`/api/payments/${paymentId}`).set(auth()).expect(200);
    return response.body.data.status as string;
  }

  async function pendingBill(label: string, amount: string): Promise<string> {
    const visitId = await openSeat(label);
    await priceAt(await placeBeer(visitId), amount);
    return (await pay(visitId, 'promptpay')).body.data.parts[0].id as string;
  }

  async function verify(id: string, body: Record<string, unknown>): Promise<request.Response> {
    return request(app.getHttpServer()).post(`/api/payments/${id}/verify-slip`).set(auth()).send(body);
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

  async function pay(visitId: string, method: 'promptpay' | 'cash'): Promise<request.Response> {
    return request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set(auth())
      .send({ method, mode: 'merge' })
      .expect(201);
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
