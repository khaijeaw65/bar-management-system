import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

describe('Payments Today (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let cashierToken: string;
  let unprivilegedToken: string;

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
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    await seedVenue(dataSource);

    const cashierId = await insertStaff(dataSource, 'แคชเชียร์');
    cashierToken = (await staffSession(app, cashierId)).accessToken;

    const unprivilegedId = await insertStaff(dataSource, 'ไม่มีสิทธิ์');
    unprivilegedToken = (await staffSession(app, unprivilegedId)).accessToken;
  });

  it('AC-1 & AC-3: returns today payments with envelope, summary metrics, and seatLabel', async () => {
    const seat = (await dataSource.query(`SELECT id, label FROM table_seat LIMIT 1`))[0];
    const visit = (
      await dataSource.query(
        `INSERT INTO visit (table_seat_id, state, opened_at, opened_via)
         VALUES ($1, 'open', NOW(), 'pos')
         RETURNING id`,
        [seat.id],
      )
    )[0];

    await dataSource.query(
      `INSERT INTO payment (visit_id, attempt_id, part_no, part_count, amount, method, status, confirmed_via, paid_at, created_at)
       VALUES ($1, gen_random_uuid(), 1, 1, 500.00, 'cash', 'completed', 'cash', NOW(), NOW())`,
      [visit.id],
    );

    const res = await request(app.getHttpServer())
      .get('/api/payments/today')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    const { data } = res.body;
    expect(data).toHaveProperty('businessDate');
    expect(data).toHaveProperty('summary');
    expect(data.summary).toMatchObject({
      totalRevenue: '500.00',
      cashTotal: '500.00',
      completedCount: 1,
    });
    expect(data.items).toHaveLength(1);
    expect(data.items[0]).toMatchObject({
      seatLabel: seat.label,
      amount: '500.00',
      method: 'cash',
      status: 'completed',
      confirmedVia: 'cash',
    });
  });

  it('AC-2: filters payments by current venue business date', async () => {
    const seat = (await dataSource.query(`SELECT id, label FROM table_seat LIMIT 1`))[0];
    const visit = (
      await dataSource.query(
        `INSERT INTO visit (table_seat_id, state, opened_at, opened_via)
         VALUES ($1, 'open', NOW(), 'pos')
         RETURNING id`,
        [seat.id],
      )
    )[0];

    // Older payment 3 days ago
    await dataSource.query(
      `INSERT INTO payment (visit_id, attempt_id, part_no, part_count, amount, method, status, confirmed_via, paid_at, created_at)
       VALUES ($1, gen_random_uuid(), 1, 1, 300.00, 'cash', 'completed', 'cash', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')`,
      [visit.id],
    );

    // Current payment today
    await dataSource.query(
      `INSERT INTO payment (visit_id, attempt_id, part_no, part_count, amount, method, status, confirmed_via, paid_at, created_at)
       VALUES ($1, gen_random_uuid(), 1, 1, 200.00, 'promptpay', 'completed', 'webhook', NOW(), NOW())`,
      [visit.id],
    );

    const res = await request(app.getHttpServer())
      .get('/api/payments/today')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].amount).toBe('200.00');
    expect(res.body.data.summary.totalRevenue).toBe('200.00');
  });

  it('AC-4: returns 403 Forbidden when caller lacks payments:read', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/payments/today')
      .set('Authorization', `Bearer ${unprivilegedToken}`);

    expect(res.status).toBe(403);
  });
});
