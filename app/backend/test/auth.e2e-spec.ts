import './set-auth-env.js';
import { Logger, type INestApplication } from '@nestjs/common';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-32-characters';
process.env.JWT_ACCESS_TTL = '15m';
process.env.REFRESH_TTL_DAYS = '7';
process.env.LINE_CHANNEL_ID = 'line-channel-test';
process.env.LINE_CHANNEL_SECRET = 'line-channel-secret-test';
process.env.LINE_CALLBACK_URL = 'http://localhost:3001/api/auth/line/callback';
process.env.FRONTEND_URL = 'http://localhost:3000';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import {
  LINE_CLIENT,
  buildLineAuthorizeUrl,
  type LineClient,
} from '../src/modules/auth/domain/line-client.js';
import type {
  LineAuthorizeInput,
  LineProfile,
  LineTokenExchange,
} from '../src/modules/auth/domain/line-client.types.js';
import { JwtConfigService } from '../src/providers/config/jwt/config.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';

const FRONTEND = 'http://localhost:3000';

class FakeLineClient implements LineClient {
  public profile: LineProfile = { sub: 'U-unset', name: null, picture: null };

  public authorizeUrl(input: LineAuthorizeInput): string {
    return buildLineAuthorizeUrl({
      channelId: process.env.LINE_CHANNEL_ID ?? '',
      callbackUrl: process.env.LINE_CALLBACK_URL ?? '',
      state: input.state,
      nonce: input.nonce,
    });
  }

  public exchangeCode(): Promise<LineTokenExchange> {
    return Promise.resolve({ idToken: 'fake-id-token' });
  }

  public verifyIdToken(): Promise<LineProfile> {
    return Promise.resolve(this.profile);
  }
}

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

function headerMap(headers: string[]): string {
  return headers.join('\n');
}

describe('Auth (e2e)', () => {
  const line = new FakeLineClient();
  let app: INestApplication;
  let dataSource: DataSource;
  let redis: RedisService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LINE_CLIENT)
      .useValue(line)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    redis = app.get(RedisService);
    await redis.client.flushdb();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM staff_access_request');
    await dataSource.query('DELETE FROM staff_user_identity');
    await dataSource.query('DELETE FROM staff_user');
    await redis.client.flushdb();
    line.profile = { sub: 'U-unset', name: null, picture: null };
  });

  async function insertStaff(input: {
    externalId: string;
    displayName: string;
    avatarUrl?: string | null;
    isActive?: boolean;
  }): Promise<string> {
    const inserted: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO staff_user (display_name, is_active) VALUES ($1, $2) RETURNING id`,
      [input.displayName, input.isActive ?? true],
    );
    const id = inserted[0]?.id;
    if (!id) throw new Error('staff insert failed');
    await dataSource.query(
      `INSERT INTO staff_user_identity (user_id, provider, external_id, display_name, avatar_url)
       VALUES ($1, 'line', $2, $3, $4)`,
      [id, input.externalId, input.displayName, input.avatarUrl ?? null],
    );
    return id;
  }

  async function startLogin(): Promise<{
    state: string;
    nonce: string;
    location: string;
  }> {
    const res = await request(app.getHttpServer())
      .get('/api/auth/line/login')
      .expect(302);
    const location = res.headers.location;
    expect(location).toBeTruthy();
    const url = new URL(location);
    const state = url.searchParams.get('state');
    const nonce = url.searchParams.get('nonce');
    if (!state || !nonce)
      throw new Error('login redirect is missing state or nonce');
    return { state, nonce, location };
  }

  function callback(state: string, code = 'auth-code') {
    return request(app.getHttpServer())
      .get('/api/auth/line/callback')
      .query({ code, state });
  }

  it('redirects to LINE and stores the state once', async () => {
    const { state, nonce, location } = await startLogin();
    const url = new URL(location);

    expect(url.origin + url.pathname).toBe(
      'https://access.line.me/oauth2/v2.1/authorize',
    );
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('line-channel-test');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3001/api/auth/line/callback',
    );
    expect(url.searchParams.get('scope')).toBe('profile openid');
    expect(url.searchParams.get('state')).toBe(state);
    expect(url.searchParams.get('nonce')).toBe(nonce);

    const stored = await redis.client.get(`oauth:${state}`);
    expect(stored).toBe(JSON.stringify({ nonce }));
    expect(await redis.client.ttl(`oauth:${state}`)).toBeGreaterThan(590);
    expect(await redis.client.ttl(`oauth:${state}`)).toBeLessThanOrEqual(600);

    const second = await startLogin();
    expect(second.state).not.toBe(state);
    expect(await redis.client.exists(`oauth:${state}`)).toBe(1);
    expect(await redis.client.exists(`oauth:${second.state}`)).toBe(1);
  });

  it('sets both cookies for a registered identity and returns the user', async () => {
    const userId = await insertStaff({
      externalId: 'U-owner',
      displayName: 'Owner',
      avatarUrl: 'https://cdn.example/owner.png',
    });
    line.profile = {
      sub: 'U-owner',
      name: 'Owner',
      picture: 'https://cdn.example/owner.png',
    };
    const { state } = await startLogin();
    const res = await callback(state).expect(302);

    expect(res.headers.location).toBe(`${FRONTEND}/`);
    const headers = setCookieHeaders(res);
    const access = cookieValue(headers, 'access_token');
    const refresh = cookieValue(headers, 'refresh_token');
    expect(access).toBeTruthy();
    expect(refresh).toBeTruthy();
    const printed = headerMap(headers);
    expect(printed).toContain('HttpOnly');
    expect(printed).toContain('SameSite=Lax');
    expect(printed).not.toMatch(/(?:^|;\s*)Secure(?:;|$)/);
    const accessLine = headers.find((item) => item.startsWith('access_token='));
    const refreshLine = headers.find((item) =>
      item.startsWith('refresh_token='),
    );
    expect(accessLine).toMatch(/Path=\/(?:;|$)/);
    expect(refreshLine).toContain('Path=/api/auth');
    const jwt = app.get(JwtConfigService);
    expect(accessLine).toContain(`Max-Age=${jwt.accessTtlSeconds}`);
    expect(refreshLine).toContain(`Max-Age=${jwt.refreshTtlSeconds}`);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${access}`)
      .expect(200)
      .expect({
        status: 200,
        code: '',
        message: 'success',
        data: {
          id: userId,
          displayName: 'Owner',
          avatarUrl: 'https://cdn.example/owner.png',
        },
      });
  });

  it('sends login_failed for an unknown or replayed state and logs nothing sensitive', async () => {
    const messages: string[] = [];
    const write = (message: unknown) => {
      messages.push(String(message));
    };
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(write);
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(write);

    const unknown = await callback('missing-state');
    expect(unknown.status).toBe(302);
    expect(unknown.headers.location).toBe(
      `${FRONTEND}/login?error=login_failed`,
    );
    expect(
      cookieValue(setCookieHeaders(unknown), 'access_token'),
    ).toBeUndefined();

    line.profile = { sub: 'U-owner', name: 'Owner', picture: null };
    await insertStaff({ externalId: 'U-owner', displayName: 'Owner' });
    const { state } = await startLogin();
    await callback(state).expect(302);
    const replay = await callback(state, 'auth-code-replay');
    expect(replay.headers.location).toBe(
      `${FRONTEND}/login?error=login_failed`,
    );

    const text = messages.join('\n');
    expect(text).not.toContain('auth-code');
    expect(text).not.toContain('fake-id-token');
    log.mockRestore();
    warn.mockRestore();
  });

  it('records one pending access request and keeps a rejected row rejected', async () => {
    const messages: string[] = [];
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation((message) => {
        messages.push(String(message));
      });
    line.profile = {
      sub: 'U-new',
      name: 'New Staff',
      picture: 'https://cdn.example/new.png',
    };

    const first = await startLogin();
    const created = await callback(first.state).expect(302);
    expect(created.headers.location).toBe(
      `${FRONTEND}/login?error=not_registered`,
    );
    expect(
      cookieValue(setCookieHeaders(created), 'access_token'),
    ).toBeUndefined();
    expect(messages.some((line) => line.includes('sub=U-new'))).toBe(true);

    line.profile = {
      sub: 'U-new',
      name: 'Updated Name',
      picture: 'https://cdn.example/updated.png',
    };
    const second = await startLogin();
    await callback(second.state).expect(302);

    const pending = await dataSource.query(
      `SELECT display_name, avatar_url, status FROM staff_access_request WHERE external_id = 'U-new'`,
    );
    expect(pending).toEqual([
      {
        display_name: 'Updated Name',
        avatar_url: 'https://cdn.example/updated.png',
        status: 'pending',
      },
    ]);

    await dataSource.query(
      `UPDATE staff_access_request SET status = 'rejected' WHERE external_id = 'U-new'`,
    );
    line.profile = {
      sub: 'U-new',
      name: 'Still Rejected',
      picture: 'https://cdn.example/rejected.png',
    };
    const third = await startLogin();
    await callback(third.state).expect(302);
    const rejected = await dataSource.query(
      `SELECT display_name, avatar_url, status FROM staff_access_request WHERE external_id = 'U-new'`,
    );
    expect(rejected).toEqual([
      {
        display_name: 'Still Rejected',
        avatar_url: 'https://cdn.example/rejected.png',
        status: 'rejected',
      },
    ]);
    log.mockRestore();
  });

  it('does not create an access request for an inactive identity', async () => {
    const messages: string[] = [];
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation((message) => {
        messages.push(String(message));
      });
    await insertStaff({
      externalId: 'U-inactive',
      displayName: 'Inactive',
      isActive: false,
    });
    line.profile = { sub: 'U-inactive', name: 'Inactive', picture: null };
    const { state } = await startLogin();
    const res = await callback(state).expect(302);

    expect(res.headers.location).toBe(`${FRONTEND}/login?error=not_registered`);
    expect(cookieValue(setCookieHeaders(res), 'access_token')).toBeUndefined();
    expect(messages.some((line) => line.includes('sub=U-inactive'))).toBe(true);
    const rows = await dataSource.query(
      `SELECT id FROM staff_access_request WHERE external_id = 'U-inactive'`,
    );
    expect(rows).toEqual([]);
    log.mockRestore();
  });

  it('rotates refresh cookies and revokes the new token when the old one is reused', async () => {
    await insertStaff({ externalId: 'U-rotate', displayName: 'Rotate' });
    line.profile = { sub: 'U-rotate', name: 'Rotate', picture: null };
    const { state } = await startLogin();
    const loggedIn = await callback(state).expect(302);
    const firstHeaders = setCookieHeaders(loggedIn);
    const access = cookieValue(firstHeaders, 'access_token');
    const refresh = cookieValue(firstHeaders, 'refresh_token');

    const rotated = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `access_token=${access}; refresh_token=${refresh}`)
      .expect(200)
      .expect({
        status: 200,
        code: '',
        message: 'success',
        data: { ok: true },
      });
    const nextHeaders = setCookieHeaders(rotated);
    const nextAccess = cookieValue(nextHeaders, 'access_token');
    const nextRefresh = cookieValue(nextHeaders, 'refresh_token');
    expect(nextAccess).toBeTruthy();
    expect(nextRefresh).toBeTruthy();
    expect(nextRefresh).not.toBe(refresh);

    const reused = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refresh}`)
      .expect(401)
      .expect({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        data: null,
      });
    const cleared = headerMap(setCookieHeaders(reused));
    expect(cleared).toContain('access_token=');
    expect(cleared).toContain('refresh_token=');

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${nextRefresh}`)
      .expect(401);
  });

  it('revokes only the logged-out session', async () => {
    await insertStaff({ externalId: 'U-two', displayName: 'Two' });
    line.profile = { sub: 'U-two', name: 'Two', picture: null };

    const first = await startLogin();
    const sessionA = setCookieHeaders(await callback(first.state).expect(302));
    const second = await startLogin();
    const sessionB = setCookieHeaders(await callback(second.state).expect(302));
    const accessA = cookieValue(sessionA, 'access_token');
    const refreshA = cookieValue(sessionA, 'refresh_token');
    const accessB = cookieValue(sessionB, 'access_token');

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `access_token=${accessA}; refresh_token=${refreshA}`)
      .expect(200)
      .expect({
        status: 200,
        code: '',
        message: 'success',
        data: { ok: true },
      });

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${accessA}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${refreshA}`)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${accessB}`)
      .expect(200);
  });

  it('requires an access token, accepts a bearer token, and leaves health public', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401).expect({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      data: null,
    });

    await insertStaff({ externalId: 'U-bearer', displayName: 'Bearer' });
    line.profile = { sub: 'U-bearer', name: 'Bearer', picture: null };
    const { state } = await startLogin();
    const loggedIn = await callback(state).expect(302);
    const access = cookieValue(setCookieHeaders(loggedIn), 'access_token');

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', 'access_token=not-a-jwt')
      .set('Authorization', `Bearer ${access}`)
      .expect(401);

    await request(app.getHttpServer()).get('/api/health').expect(200);
  });
});
