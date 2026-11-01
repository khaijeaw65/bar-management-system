import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-32-characters';
process.env.JWT_ACCESS_TTL = '15m';
process.env.REFRESH_TTL_DAYS = '7';
process.env.FRONTEND_URL = 'http://localhost:3000';

import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { AppConfigService } from '../src/providers/config/app/config.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';

function setCookieHeaders(res: request.Response): string[] {
  const header = res.headers['set-cookie'];
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

function cookieValue(headers: string[], name: string): string | undefined {
  const line = headers.find((item) => item.startsWith(`${name}=`));
  if (!line) return undefined;
  return line.slice(name.length + 1).split(';')[0];
}

describe('Demo Login (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let redis: RedisService;
  let appConfig: AppConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    redis = app.get(RedisService);
    appConfig = app.get(AppConfigService);
    await redis.client.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await redis.client.flushdb();
  });

  it('logs in as demo owner and sets session cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/demo-login')
      .send({ role: 'owner' })
      .expect(200);

    expect(res.body.data).toEqual({ ok: true });
    const cookies = setCookieHeaders(res);
    const accessToken = cookieValue(cookies, 'access_token');
    const refreshToken = cookieValue(cookies, 'refresh_token');
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    expect(meRes.body.data.displayName).toContain('เจ้าของ');

    const permRes = await request(app.getHttpServer())
      .get('/api/me/permissions')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    const ownerGroups = permRes.body.data.groups.map((g: { name: string }) => g.name);
    expect(ownerGroups).toContain('เจ้าของ');
  });

  it('logs in as demo manager and has manager permissions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/demo-login')
      .send({ role: 'manager' })
      .expect(200);

    const cookies = setCookieHeaders(res);
    const accessToken = cookieValue(cookies, 'access_token');

    const permRes = await request(app.getHttpServer())
      .get('/api/me/permissions')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    const managerGroups = permRes.body.data.groups.map((g: { name: string }) => g.name);
    expect(managerGroups).toContain('ผู้จัดการ');
  });

  it('logs in as demo staff and has staff permissions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/demo-login')
      .send({ role: 'staff' })
      .expect(200);

    const cookies = setCookieHeaders(res);
    const accessToken = cookieValue(cookies, 'access_token');

    const permRes = await request(app.getHttpServer())
      .get('/api/me/permissions')
      .set('Cookie', [`access_token=${accessToken}`])
      .expect(200);

    const staffGroups = permRes.body.data.groups.map((g: { name: string }) => g.name);
    expect(staffGroups).toContain('พนักงาน');
  });

  it('rejects invalid role with 400 Bad Request', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/demo-login')
      .send({ role: 'invalid_role' })
      .expect(400);
  });

  it('returns 404 in production environment', async () => {
    // Spy or mock nodeEnv on appConfig
    const originalEnv = appConfig.nodeEnv;
    Object.defineProperty(appConfig, 'nodeEnv', {
      value: 'production',
      configurable: true,
    });

    try {
      await request(app.getHttpServer())
        .post('/api/auth/demo-login')
        .send({ role: 'owner' })
        .expect(404);
    } finally {
      Object.defineProperty(appConfig, 'nodeEnv', {
        value: originalEnv,
        configurable: true,
      });
    }
  });
});
