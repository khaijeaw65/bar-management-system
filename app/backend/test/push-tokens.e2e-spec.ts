import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const TOKEN = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';

describe('Push tokens (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
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
    await clearStaffAndVenue(dataSource);
  });

  const auth = async (name: string) => {
    const staffId = await insertStaff(dataSource, name);
    const session = await staffSession(app, staffId);
    return { staffId, header: { Authorization: `Bearer ${session.accessToken}` } };
  };

  const put = (header: Record<string, string>, body: unknown) =>
    request(app.getHttpServer()).put('/api/notifications/push-tokens').set(header).send(body as object);

  const del = (header: Record<string, string>, token: string) =>
    request(app.getHttpServer())
      .delete(`/api/notifications/push-tokens/${encodeURIComponent(token)}`)
      .set(header);

  const rows = async (): Promise<Array<{ staff_user_id: string; platform: string }>> =>
    await dataSource.query('SELECT staff_user_id, platform FROM staff_push_token');

  it('AC-1: registers a token for the caller, reassigns it to the next caller, rejects bad format', async () => {
    const first = await auth('เอ');
    const second = await auth('บี');

    const created = await put(first.header, { token: TOKEN, platform: 'android' }).expect(200);
    expect(created.body.data).toEqual({ ok: true });
    expect(await rows()).toEqual([{ staff_user_id: first.staffId, platform: 'android' }]);

    await put(second.header, { token: TOKEN, platform: 'ios' }).expect(200);
    expect(await rows()).toEqual([{ staff_user_id: second.staffId, platform: 'ios' }]);

    const bad = await put(first.header, { token: 'not-a-token', platform: 'android' }).expect(400);
    expect(bad.body.code).toBe('VALIDATION_ERROR');
    expect(await rows()).toHaveLength(1);
  });

  it('AC-1: refuses a request with no session', async () => {
    await request(app.getHttpServer())
      .put('/api/notifications/push-tokens')
      .send({ token: TOKEN, platform: 'android' })
      .expect(401);
  });

  it('AC-2: deletes the caller’s own token; another staff’s token stays; unknown is 204', async () => {
    const owner = await auth('เอ');
    const other = await auth('บี');
    await put(owner.header, { token: TOKEN, platform: 'android' }).expect(200);

    await del(other.header, TOKEN).expect(204);
    expect(await rows()).toHaveLength(1);

    await del(owner.header, TOKEN).expect(204);
    expect(await rows()).toHaveLength(0);

    await del(owner.header, TOKEN).expect(204);
  });
});
