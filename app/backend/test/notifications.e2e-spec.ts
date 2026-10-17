import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
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

  it('refuses a foreign Origin even with a live token', async () => {
    const staffId = await insertStaff(dataSource, 'Owner');
    const session = await staffSession(app, staffId);
    await expect(
      connect(httpPort(app), {
        token: session.accessToken,
        origin: 'https://evil.example',
      }),
    ).rejects.toThrow();
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

  it('delivers order.created and ticket.status_changed on the staff room', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    const staffId = await insertStaff(dataSource, 'เอ');
    const session = await staffSession(app, staffId);
    const socket = await connect(httpPort(app), { token: session.accessToken });
    const created = once(socket, 'order.created');
    const changed = once(socket, 'ticket.status_changed');

    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = 'T1'`,
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );
    const ordered = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);
    const order = await created;
    expect(order).toMatchObject({ id: ordered.body.data.id, orderNumber: 1 });

    const ticketId = ordered.body.data.tickets[0].id as string;
    await request(app.getHttpServer())
      .post(`/api/tickets/${ticketId}/accept`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);
    const event = await changed;
    expect(event).toMatchObject({
      ticketId,
      status: 'accepted',
      updatedBy: { displayName: 'เอ' },
    });
    socket.close();
  });

  it('emits nothing when placement rolls back', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    const staffId = await insertStaff(dataSource, 'เอ');
    const session = await staffSession(app, staffId);
    const socket = await connect(httpPort(app), { token: session.accessToken });
    const events: unknown[] = [];
    socket.on('order.created', (payload) => events.push(payload));

    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = 'T2'`,
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    const visitId = opened.body.data.visit.id as string;
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์'`,
    );
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(409);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(events).toEqual([]);
    socket.close();
  });
});

function connect(
  port: number,
  credential: { token?: string; cookie?: string; origin?: string } = {},
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      origin: credential.origin ?? 'http://localhost:3000',
    };
    if (credential.cookie) headers.cookie = `access_token=${credential.cookie}`;
    const socket = io(`http://127.0.0.1:${port}/staff`, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 4_000,
      auth: credential.token ? { token: credential.token } : {},
      extraHeaders: headers,
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
