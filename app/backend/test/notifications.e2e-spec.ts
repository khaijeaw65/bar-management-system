import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { TokenService } from '../src/modules/auth/application/token.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import {
  clearStaffAndVenue,
  httpPort,
  insertStaff,
  staffSession,
} from './staff-session.js';

describe('Notifications gateway (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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
  });

  it('refuses a socket with no token, a bad token, or a revoked session', async () => {
    const port = httpPort(app);
    await expect(connect(port)).rejects.toThrow();
    await expect(connect(port, { token: 'not-a-jwt' })).rejects.toThrow();

    const staffId = await insertStaff(dataSource, 'Owner');
    const session = await staffSession(app, staffId);
    await app.get(TokenService).revokeByRefreshToken(session.refreshToken);
    await expect(connect(port, { token: session.accessToken })).rejects.toThrow();
  });

  it('accepts the access token from auth.token and from the cookie', async () => {
    const staffId = await insertStaff(dataSource, 'Owner');
    const session = await staffSession(app, staffId);
    const port = httpPort(app);

    const byAuth = await connect(port, { token: session.accessToken });
    byAuth.close();
    const byCookie = await connect(port, { cookie: session.accessToken });
    byCookie.close();
  });
});

function connect(
  port: number,
  credential: { token?: string; cookie?: string } = {},
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}/staff`, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 4_000,
      auth: credential.token ? { token: credential.token } : {},
      extraHeaders: credential.cookie
        ? { cookie: `access_token=${credential.cookie}` }
        : {},
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => {
      socket.close();
      reject(error);
    });
  });
}
