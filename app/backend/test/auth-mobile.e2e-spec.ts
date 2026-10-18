import './set-auth-env.js';
import { createHash, randomBytes } from 'node:crypto';
import { Logger, type INestApplication } from '@nestjs/common';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-32-characters';
process.env.JWT_ACCESS_TTL = '15m';
process.env.REFRESH_TTL_DAYS = '7';
process.env.MOBILE_REFRESH_TTL_DAYS = '30';
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
const MOBILE_TTL_SECONDS = 2_592_000;
const EVIL = 'https://evil.example/steal';

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

function codeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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

function familyId(accessToken: string): string {
  const part = accessToken.split('.')[1];
  if (!part) throw new Error('access token is missing a payload');
  const payload = JSON.parse(Buffer.from(part, 'base64url').toString()) as {
    sid?: unknown;
  };
  if (typeof payload.sid !== 'string') throw new Error('access token is missing sid');
  return payload.sid;
}

describe('Mobile auth (e2e)', () => {
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
    isActive?: boolean;
  }): Promise<string> {
    const inserted: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO staff_user (display_name, is_active) VALUES ($1, $2) RETURNING id`,
      [input.displayName, input.isActive ?? true],
    );
    const id = inserted[0]?.id;
    if (!id) throw new Error('staff insert failed');
    await dataSource.query(
      `INSERT INTO staff_user_identity (user_id, provider, external_id, display_name)
       VALUES ($1, 'line', $2, $3)`,
      [id, input.externalId, input.displayName],
    );
    return id;
  }

  async function startMobile(verifier = codeVerifier()) {
    const challenge = codeChallenge(verifier);
    const res = await request(app.getHttpServer())
      .get('/api/auth/line/login')
      .query({
        client: 'mobile',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        redirect: EVIL,
        redirect_uri: EVIL,
      })
      .expect(302);
    const location = String(res.headers.location);
    const url = new URL(location);
    const state = url.searchParams.get('state');
    const nonce = url.searchParams.get('nonce');
    if (!state || !nonce) throw new Error('login redirect is missing state or nonce');
    return { verifier, challenge, state, nonce, location };
  }

  function callback(state: string, query: Record<string, string> = {}) {
    return request(app.getHttpServer())
      .get('/api/auth/line/callback')
      .query({ code: 'auth-code', state, ...query });
  }

  async function loginMobile(externalId = 'U-mobile', displayName = 'Mobile') {
    const userId = await insertStaff({ externalId, displayName });
    line.profile = { sub: externalId, name: displayName, picture: null };
    const started = await startMobile();
    const res = await callback(started.state, {
      redirect: EVIL,
      redirect_uri: EVIL,
    }).expect(302);
    const code = new URL(String(res.headers.location)).searchParams.get('code');
    if (!code) throw new Error('mobile callback is missing a code');
    return { userId, ...started, code, callback: res };
  }

  it('stores a mobile challenge and rejects a mobile login without one', async () => {
    const started = await startMobile();
    expect(started.state).toMatch(/^m\.[A-Za-z0-9_-]{43}$/);
    expect(new URL(started.location).origin).toBe('https://access.line.me');
    expect(started.location).not.toContain('evil.example');
    const stored = await redis.client.get(`oauth:${started.state}`);
    expect(stored).toBe(
      JSON.stringify({
        nonce: started.nonce,
        client: 'mobile',
        codeChallenge: started.challenge,
      }),
    );
    expect(await redis.client.ttl(`oauth:${started.state}`)).toBeGreaterThan(590);
    expect(await redis.client.ttl(`oauth:${started.state}`)).toBeLessThanOrEqual(600);

    const missing = await request(app.getHttpServer())
      .get('/api/auth/line/login')
      .query({ client: 'mobile' })
      .expect(400);
    expect(missing.body).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      data: null,
    });
    expect(JSON.stringify(missing.body.message)).toContain('ไม่ถูกต้อง');
    const before = await redis.client.dbsize();
    await request(app.getHttpServer())
      .get('/api/auth/line/login')
      .query({
        client: 'mobile',
        code_challenge: 'not-a-challenge',
        code_challenge_method: 'plain',
      })
      .expect(400);
    expect(await redis.client.dbsize()).toBe(before);

    const web = await request(app.getHttpServer())
      .get('/api/auth/line/login')
      .query({ code_challenge: started.challenge, code_challenge_method: 'S256' })
      .expect(302);
    const webState = new URL(String(web.headers.location)).searchParams.get('state');
    expect(webState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.parse(String(await redis.client.get(`oauth:${webState}`)))).toEqual({
      nonce: expect.any(String),
    });
  });

  it('redirects a registered staff user to barapp without a session or cookies', async () => {
    const loggedIn = await loginMobile();
    const location = String(loggedIn.callback.headers.location);
    const url = new URL(location);
    expect(url.protocol).toBe('barapp:');
    expect(url.hostname).toBe('auth');
    expect(url.searchParams.get('code')).toBe(loggedIn.code);
    expect(url.searchParams.get('error')).toBeNull();
    expect(location).not.toContain('evil.example');
    expect(cookieValue(setCookieHeaders(loggedIn.callback), 'access_token')).toBeUndefined();
    expect(cookieValue(setCookieHeaders(loggedIn.callback), 'refresh_token')).toBeUndefined();
    expect(await redis.client.keys('session:*')).toEqual([]);
    expect(await redis.client.keys('refresh:*')).toEqual([]);
    const ttl = await redis.client.ttl(`mauth:${loggedIn.code}`);
    expect(ttl).toBeGreaterThan(50);
    expect(ttl).toBeLessThanOrEqual(60);
    const record = JSON.parse(String(await redis.client.get(`mauth:${loggedIn.code}`)));
    expect(record).toEqual({
      userId: loggedIn.userId,
      codeChallenge: loggedIn.challenge,
    });
  });

  it('sends login_failed for a LINE error or a replay, and not_registered for an unknown or inactive identity', async () => {
    line.profile = { sub: 'U-mobile', name: 'Mobile', picture: null };
    await insertStaff({ externalId: 'U-mobile', displayName: 'Mobile' });
    const started = await startMobile();
    const failed = await callback(started.state, { error: 'access_denied' }).expect(302);
    expect(failed.headers.location).toBe('barapp://auth?error=login_failed');
    expect(await redis.client.exists(`oauth:${started.state}`)).toBe(0);
    expect(await redis.client.keys('mauth:*')).toEqual([]);

    const replay = await callback(started.state).expect(302);
    expect(replay.headers.location).toBe('barapp://auth?error=login_failed');
    expect(await redis.client.keys('session:*')).toEqual([]);
    expect(await redis.client.keys('oauth-mobile:*')).toEqual([]);

    const unknown = await callback('missing-state').expect(302);
    expect(unknown.headers.location).toBe(`${FRONTEND}/login?error=login_failed`);

    line.profile = { sub: 'U-new', name: 'New', picture: null };
    const unregistered = await startMobile();
    const created = await callback(unregistered.state).expect(302);
    expect(created.headers.location).toBe('barapp://auth?error=not_registered');
    const pending = await dataSource.query(
      `SELECT status FROM staff_access_request WHERE external_id = 'U-new'`,
    );
    expect(pending).toEqual([{ status: 'pending' }]);

    await insertStaff({
      externalId: 'U-inactive',
      displayName: 'Inactive',
      isActive: false,
    });
    line.profile = { sub: 'U-inactive', name: 'Inactive', picture: null };
    const inactive = await startMobile();
    const rejected = await callback(inactive.state).expect(302);
    expect(rejected.headers.location).toBe('barapp://auth?error=not_registered');
    const rows = await dataSource.query(
      `SELECT id FROM staff_access_request WHERE external_id = 'U-inactive'`,
    );
    expect(rows).toEqual([]);
    expect(await redis.client.keys('oauth-mobile:*')).toEqual([]);
  });

  it('sends login_failed when an m. state has expired', async () => {
    const started = await startMobile();
    await redis.client.pexpire(`oauth:${started.state}`, 30);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const expired = await callback(started.state).expect(302);
    expect(expired.headers.location).toBe('barapp://auth?error=login_failed');
    expect(await redis.client.keys('session:*')).toEqual([]);
    expect(await redis.client.keys('mauth:*')).toEqual([]);
    expect(await redis.client.keys('oauth-mobile:*')).toEqual([]);
  });

  it('exchanges a matching verifier for a bearer session', async () => {
    const loggedIn = await loginMobile('U-bearer', 'Bearer');
    const jwt = app.get(JwtConfigService);
    const res = await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: loggedIn.code, codeVerifier: loggedIn.verifier })
      .expect(200);
    expect(res.body).toMatchObject({
      status: 200,
      code: '',
      message: 'success',
      data: { expiresIn: jwt.accessTtlSeconds },
    });
    const accessToken = res.body.data.accessToken as string;
    const refreshToken = res.body.data.refreshToken as string;
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));
    expect(await redis.client.exists(`mauth:${loggedIn.code}`)).toBe(0);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({
        status: 200,
        code: '',
        message: 'success',
        data: {
          id: loggedIn.userId,
          displayName: 'Bearer',
          avatarUrl: null,
        },
      });
  });

  it('rejects a wrong, expired, or already used code and creates no session', async () => {
    const loggedIn = await loginMobile();
    await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: loggedIn.code, codeVerifier: codeVerifier() })
      .expect(401)
      .expect({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        data: null,
      });
    expect(await redis.client.exists(`mauth:${loggedIn.code}`)).toBe(0);
    expect(await redis.client.keys('session:*')).toEqual([]);

    await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: loggedIn.code, codeVerifier: loggedIn.verifier })
      .expect(401);
    expect(await redis.client.keys('session:*')).toEqual([]);

    const verifier = codeVerifier();
    const challenge = codeChallenge(verifier);
    await redis.client.set(
      'mauth:expired-code',
      JSON.stringify({ userId: 'user', codeChallenge: challenge }),
      'PX',
      30,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: 'expired-code', codeVerifier: verifier })
      .expect(401);
    expect(await redis.client.keys('session:*')).toEqual([]);
  });

  it('rotates a mobile refresh token on the mobile TTL and revokes the family on reuse', async () => {
    const loggedIn = await loginMobile();
    const first = await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: loggedIn.code, codeVerifier: loggedIn.verifier })
      .expect(200);
    const accessToken = first.body.data.accessToken as string;
    const refreshToken = first.body.data.refreshToken as string;
    const sid = familyId(accessToken);
    await expectMobileTtl(refreshToken, sid);

    const rotated = await request(app.getHttpServer())
      .post('/api/auth/mobile/refresh')
      .send({ refreshToken })
      .expect(200);
    const nextAccess = rotated.body.data.accessToken as string;
    const nextRefresh = rotated.body.data.refreshToken as string;
    expect(nextRefresh).not.toBe(refreshToken);
    expect(familyId(nextAccess)).toBe(sid);
    await expectMobileTtl(nextRefresh, sid);

    await request(app.getHttpServer())
      .post('/api/auth/mobile/refresh')
      .send({ refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${nextAccess}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/mobile/refresh')
      .send({ refreshToken: nextRefresh })
      .expect(401);
  });

  it('revokes a mobile session from the refresh token in the body', async () => {
    const loggedIn = await loginMobile();
    const issued = await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: loggedIn.code, codeVerifier: loggedIn.verifier })
      .expect(200);
    const accessToken = issued.body.data.accessToken as string;
    const refreshToken = issued.body.data.refreshToken as string;

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({ refreshToken })
      .expect(200)
      .expect({
        status: 200,
        code: '',
        message: 'success',
        data: { ok: true },
      });
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('logs neither the mobile code, the verifier, nor the tokens', async () => {
    const messages: string[] = [];
    const write = (message: unknown) => {
      messages.push(String(message));
    };
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(write);
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(write);
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(write);

    const loggedIn = await loginMobile();
    const issued = await request(app.getHttpServer())
      .post('/api/auth/mobile/token')
      .send({ code: loggedIn.code, codeVerifier: loggedIn.verifier })
      .expect(200);
    const text = messages.join('\n');
    expect(text).not.toContain(loggedIn.code);
    expect(text).not.toContain(loggedIn.verifier);
    expect(text).not.toContain(loggedIn.challenge);
    expect(text).not.toContain('auth-code');
    expect(text).not.toContain('fake-id-token');
    expect(text).not.toContain(issued.body.data.accessToken);
    expect(text).not.toContain(issued.body.data.refreshToken);

    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });

  async function expectMobileTtl(refreshToken: string, sid: string): Promise<void> {
    const refreshTtl = await redis.client.ttl(`refresh:${sha256(refreshToken)}`);
    const familyTtl = await redis.client.ttl(`family:${sid}`);
    const sessionTtl = await redis.client.ttl(`session:${sid}`);
    for (const ttl of [refreshTtl, familyTtl, sessionTtl]) {
      expect(ttl).toBeGreaterThan(MOBILE_TTL_SECONDS - 5);
      expect(ttl).toBeLessThanOrEqual(MOBILE_TTL_SECONDS);
    }
  }
});
