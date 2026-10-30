import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { asGuest, openVisit, seatByLabel, startGuest, variantByName, waitFor } from './customer-fixtures.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

interface Ping {
  visitId: string;
  sessionEnded?: boolean;
}

describe('Customer socket /customer (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  const sockets: Socket[] = [];

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
    for (const socket of sockets) socket.close();
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    accessToken = (await staffSession(app, await insertStaff(dataSource, 'Owner'))).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('pings the visit on an 86 cancel, on accept and on close, and nobody else (AC-8)', async () => {
    const seatA = await seatByLabel(dataSource, 'T1');
    const seatB = await seatByLabel(dataSource, 'T2');
    const visitA = (await openVisit(app, accessToken, seatA.id).expect(201)).body.data.visit.id as string;
    await openVisit(app, accessToken, seatB.id).expect(201);
    const phoneA = await startGuest(app, seatA.qr);
    const phoneB = await startGuest(app, seatB.qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    const nuts = await variantByName(dataSource, 'ถั่วทอดสมุนไพร');
    const pingsA = await listen(phoneA);
    const pingsB = await listen(phoneB);

    const placed = await asGuest(app, 'post', '/orders', phoneA)
      .send({
        items: [
          { variantId: beer.variantId, quantity: 1 },
          { variantId: nuts.variantId, quantity: 1 },
        ],
      })
      .expect(201);
    await waitFor(() => pingsA.length === 1, 'ping for the new order');

    await request(app.getHttpServer()).post(`/api/menu/items/${nuts.itemId}/mark-unavailable`).set(staff()).expect(200);
    await waitFor(() => pingsA.length === 2, 'ping for the cancel');

    const order = await request(app.getHttpServer())
      .get(`/api/orders/${placed.body.data.orderId}`)
      .set(staff())
      .expect(200);
    const ticket = (order.body.data.tickets as Array<{ id: string; station: string | null }>).find((item) => item.station === 'bar');
    await request(app.getHttpServer()).post(`/api/tickets/${ticket?.id}/accept`).set(staff()).expect(200);
    await waitFor(() => pingsA.length >= 3, 'ping for the accept');

    await request(app.getHttpServer()).post(`/api/visits/${visitA}/close`).set(staff()).expect(200);
    await waitFor(() => pingsA.some((ping) => ping.sessionEnded === true), 'ping for the close');
    expect(pingsA.every((ping) => ping.visitId === visitA)).toBe(true);
    expect(pingsB).toEqual([]);
  });

  it('moves a seat-only socket onto the visit once its first order binds it (AC-8)', async () => {
    const seat = await seatByLabel(dataSource, 'T3');
    const phone = await startGuest(app, seat.qr);
    const pings = await listen(phone);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');

    const placed = await asGuest(app, 'post', '/orders', phone).send({ items: [{ variantId: beer.variantId, quantity: 1 }] }).expect(201);
    // The first order's own ping goes out before the bind — the phone refetches from its response anyway.
    const order = await request(app.getHttpServer()).get(`/api/orders/${placed.body.data.orderId}`).set(staff()).expect(200);
    const ticket = (order.body.data.tickets as Array<{ id: string; station: string | null }>).find((item) => item.station === 'bar');
    const before = pings.length;
    await request(app.getHttpServer()).post(`/api/tickets/${ticket?.id}/accept`).set(staff()).expect(200);
    await waitFor(() => pings.length > before, 'ping on the same socket after the bind');
  });

  it('rejects a socket with no cookie or a bad one, and the staff token (AC-8)', async () => {
    await expect(connect()).rejects.toThrow();
    await expect(connect('guest_session=not-a-session')).rejects.toThrow();
    await expect(connect(undefined, accessToken)).rejects.toThrow();
  });

  function staff(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async function listen(cookie: string): Promise<Ping[]> {
    const pings: Ping[] = [];
    const socket = await connect(`guest_session=${cookie}`);
    socket.on('tab.changed', (payload: Ping) => pings.push(payload));
    return pings;
  }

  async function connect(cookie?: string, token?: string): Promise<Socket> {
    const headers: Record<string, string> = { origin: 'http://localhost:3000' };
    if (cookie) headers.cookie = cookie;
    const socket = await new Promise<Socket>((resolve, reject) => {
      const created = io(`http://127.0.0.1:${httpPort(app)}/customer`, {
        path: '/api/customer/socket.io',
        transports: ['websocket'],
        reconnection: false,
        timeout: 4_000,
        auth: token ? { token } : {},
        extraHeaders: headers,
      });
      created.once('connect', () => resolve(created));
      created.once('connect_error', (error) => {
        created.close();
        reject(error);
      });
    });
    sockets.push(socket);
    return socket;
  }
});
