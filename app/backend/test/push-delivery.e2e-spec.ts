import './set-auth-env.js';
import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { PushDeliveryService } from '../src/modules/notifications/application/push-delivery.service.js';
import { PushSender } from '../src/modules/notifications/application/ports/push-sender.port.js';
import { NOTIFICATION_PUSH_QUEUE } from '../src/modules/notifications/application/push.types.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { FakePushSender } from './fake-push-sender.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const token = (n: number) => `ExponentPushToken[token-${n}]`;
const REF_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('Push delivery (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let fake: FakePushSender;

  beforeAll(async () => {
    fake = new FakePushSender();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PushSender)
      .useValue(fake)
      .compile();
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
    fake.sends.length = 0;
    fake.failSend = false;
    fake.receiptResults.clear();
    fake.ticketFor = (_message, index) => ({ status: 'ok', receiptId: `receipt-${index}` });
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
  });

  const addToken = async (staffUserId: string, n: number) => {
    await dataSource.query(
      `INSERT INTO staff_push_token (staff_user_id, expo_push_token, platform) VALUES ($1, $2, 'android')`,
      [staffUserId, token(n)],
    );
  };

  const storedTokens = async (): Promise<string[]> => {
    const rows: Array<{ expo_push_token: string }> = await dataSource.query(
      'SELECT expo_push_token FROM staff_push_token ORDER BY expo_push_token',
    );
    return rows.map((row) => row.expo_push_token);
  };

  const notifyTwoStaffThreeTokens = async () => {
    const a = await insertStaff(dataSource, 'เอ');
    const b = await insertStaff(dataSource, 'บี');
    await addToken(a, 1);
    await addToken(a, 2);
    await addToken(b, 3);
    await app.get(NotificationsService).notify('order_new', [a, b], {
      title: 'ออเดอร์ใหม่ · T1',
      body: '2 รายการ',
      refType: 'order',
      refId: REF_ID,
    });
    return { a, b };
  };

  it('AC-3: one send job sends one message per token with the PDPA-safe copy and refId', async () => {
    await notifyTwoStaffThreeTokens();

    await vi.waitFor(() => expect(fake.sends).toHaveLength(1));

    const sent = fake.sends[0] ?? [];
    expect(sent.map((m) => m.to).sort()).toEqual([token(1), token(2), token(3)]);
    expect(sent.every((m) => m.title === 'ออเดอร์ใหม่ · T1' && m.body === '2 รายการ')).toBe(true);
    expect(sent.every((m) => m.data.refId === REF_ID && m.data.type === 'order_new')).toBe(true);

    const queue = app.get<Queue>(getQueueToken(NOTIFICATION_PUSH_QUEUE));
    await vi.waitFor(async () => expect(await queue.getCompletedCount()).toBe(1));
    const [completed] = await queue.getCompleted();
    expect(completed?.opts.removeOnComplete).toEqual({ age: 86_400 });
  });

  it('AC-4: a DeviceNotRegistered ticket deletes that token now; a failed receipt deletes it later', async () => {
    fake.ticketFor = (message) =>
      message.to === token(2)
        ? { status: 'error', failure: 'device_not_registered', message: 'gone' }
        : { status: 'ok', receiptId: `receipt-${message.to}` };
    await notifyTwoStaffThreeTokens();

    await vi.waitFor(async () => expect(await storedTokens()).toEqual([token(1), token(3)]));

    const queue = app.get<Queue>(getQueueToken(NOTIFICATION_PUSH_QUEUE));
    const delayed = await queue.getDelayed();
    expect(delayed).toHaveLength(1);
    const queued = delayed[0]?.data;
    if (!queued || !('tokenByReceiptId' in queued)) throw new Error('receipts job missing');
    expect(queued.tokenByReceiptId).toEqual({
      [`receipt-${token(1)}`]: token(1),
      [`receipt-${token(3)}`]: token(3),
    });

    fake.receiptResults.set(`receipt-${token(1)}`, {
      status: 'error',
      failure: 'device_not_registered',
      message: 'gone',
    });
    await app.get(PushDeliveryService).checkReceipts(queued);

    expect(await storedTokens()).toEqual([token(3)]);
  });

  it('AC-5: a failing sender is retried 3 times and the order and notification rows are untouched', async () => {
    fake.failSend = true;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    const placer = await insertStaff(dataSource, 'เอ');
    const receiver = await insertStaff(dataSource, 'บี');
    await addToken(receiver, 1);
    const header = { Authorization: `Bearer ${(await staffSession(app, placer)).accessToken}` };

    const seats: Array<{ id: string }> = await dataSource.query(`SELECT id FROM table_seat WHERE label = 'T1'`);
    const visit = await request(app.getHttpServer()).post('/api/visits').set(header).send({ tableSeatId: seats[0]?.id }).expect(201);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );
    await request(app.getHttpServer())
      .post(`/api/visits/${visit.body.data.visit.id}/orders`)
      .set(header)
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);

    await vi.waitFor(() => expect(fake.sends).toHaveLength(3), { timeout: 10_000, interval: 100 });

    const rows: Array<{ recipient_id: string; type: string }> = await dataSource.query(
      'SELECT recipient_id, type FROM notification',
    );
    expect(rows).toEqual([{ recipient_id: receiver, type: 'order_new' }]);
    expect(await storedTokens()).toEqual([token(1)]);
  });
});
