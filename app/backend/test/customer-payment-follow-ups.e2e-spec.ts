import './set-auth-env.js';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CustomerPaymentSchema, CustomerPendingPaymentSchema } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { asGuest, openVisit, seatByLabel, startGuest, variantByName } from './customer-fixtures.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

// BRIEF-052 audit follow-ups (executor tests): guest cancel reason, and a pending payment that is not PromptPay.
describe('Customer pay follow-ups (e2e, BRIEF-052)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.listen(0, '127.0.0.1');
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
    accessToken = (await staffSession(app, await insertStaff(dataSource, 'Owner'))).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(`UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`);
  });

  it('records guest_cancel for a phone cancel and staff_cancel for a POS cancel', async () => {
    const guest = await startGuest(app, (await seatByLabel(dataSource, 'T1')).qr);
    await order(guest);
    const mine = CustomerPendingPaymentSchema.parse(
      (await asGuest(app, 'post', '/payments', guest).set('Idempotency-Key', randomUUID()).send({}).expect(201)).body.data,
    );
    await asGuest(app, 'post', `/payments/${mine.id}/cancel`, guest).send({}).expect(200);
    expect(await reasonOf(mine.id)).toBe('guest_cancel');

    const seat = await seatByLabel(dataSource, 'T2');
    const visitId = (await openVisit(app, accessToken, seat.id).expect(201)).body.data.visit.id as string;
    await staffOrder(visitId);
    const posId = await staffPay(visitId);
    await request(app.getHttpServer())
      .post(`/api/payments/${posId}/cancel`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);
    expect(await reasonOf(posId)).toBe('staff_cancel');
  });

  it('keeps a non-PromptPay pending payment off the phone but still locks the bill', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const visitId = (await openVisit(app, accessToken, seat.id).expect(201)).body.data.visit.id as string;
    await staffOrder(visitId);
    const posId = await staffPay(visitId);
    // Cash is created already completed today; force the shape the guard exists for.
    await dataSource.query(`UPDATE payment SET method = 'cash', qr_payload = NULL WHERE id = $1`, [posId]);
    const guest = await startGuest(app, seat.qr);

    const view = CustomerPaymentSchema.parse((await asGuest(app, 'get', '/payment', guest).expect(200)).body.data);
    expect(view.pending).toBeNull();
    expect(view.bill.locked).toBe(true);
    const refused = await asGuest(app, 'post', '/payments', guest).set('Idempotency-Key', randomUUID()).send({}).expect(409);
    expect(refused.body.code).toBe('PAYMENT_IN_FLIGHT');
  });

  async function order(cookie: string): Promise<void> {
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    await asGuest(app, 'post', '/orders', cookie)
      .send({ items: [{ variantId: beer.variantId, quantity: 2 }] })
      .expect(201);
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

  async function reasonOf(paymentId: string): Promise<string | null> {
    const rows: Array<{ status_reason: string | null }> = await dataSource.query(
      `SELECT status_reason FROM payment WHERE id = $1`,
      [paymentId],
    );
    return rows[0]?.status_reason ?? null;
  }
});
