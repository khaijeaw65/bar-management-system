import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Order, Ticket } from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

describe('Tickets (e2e)', () => {
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
    for (const socket of sockets) socket.close();
    sockets.length = 0;
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    const staffId = await insertStaff(dataSource, 'เอ');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('skips READY at the counter and on a table when the kitchen screen is off', async () => {
    await dataSource.query(`UPDATE venue SET kitchen_display_enabled = true`);
    const counter = await placeOn('C1');
    const pending = barTicket(counter);
    const accepted = await post(`/api/tickets/${pending.id}/accept`).expect(200);
    await post(`/api/tickets/${accepted.body.data.id}/ready`).expect(409);
    const served = await post(`/api/tickets/${accepted.body.data.id}/send`).expect(200);
    expect(served.body.data.status).toBe('sent');

    const table = barTicket(await placeOn('T1'));
    const claimed = await post(`/api/tickets/${table.id}/accept`).expect(200);
    expect(claimed.body.data.acceptedBy).toMatchObject({ displayName: 'เอ' });
    await post(`/api/tickets/${table.id}/send`).expect(409);
    const ready = await post(`/api/tickets/${table.id}/ready`).expect(200);
    expect(ready.body.data.status).toBe('ready');
    expect(ready.body.data.acceptedBy).toMatchObject({ displayName: 'เอ' });
    const sent = await post(`/api/tickets/${ready.body.data.id}/send`).expect(200);
    expect(sent.body.data.status).toBe('sent');
    expect(sent.body.data.sentAt).toEqual(expect.any(String));

    await dataSource.query(`UPDATE venue SET kitchen_display_enabled = false`);
    const plain = barTicket(await placeOn('T2'));
    const started = await post(`/api/tickets/${plain.id}/accept`).expect(200);
    await post(`/api/tickets/${started.body.data.id}/ready`).expect(409);
    await post(`/api/tickets/${started.body.data.id}/send`).expect(200);
  });

  it('lets one of two concurrent accepts win', async () => {
    const ticket = barTicket(await placeOn('T3'));
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('ticket.status_changed', (payload) => events.push(payload));

    const [first, second] = await Promise.all([
      post(`/api/tickets/${ticket.id}/accept`),
      post(`/api/tickets/${ticket.id}/accept`),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
    const winner = [first, second].find((item) => item.status === 200);
    expect(winner?.body.data.acceptedBy.displayName).toBe('เอ');
    await waitFor(events, 1);
    expect(events).toHaveLength(1);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function post(path: string) {
    return request(app.getHttpServer()).post(path).set(auth());
  }

  async function placeOn(label: string): Promise<Order> {
    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = $1`,
      [label],
    );
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v
       JOIN menu_item i ON i.id = v.menu_item_id
       WHERE i.name = 'ช้างดราฟต์' LIMIT 1`,
    );
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set(auth())
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);
    return response.body.data as Order;
  }

  function barTicket(order: Order): Ticket {
    const ticket = order.tickets.find((item) => item.station === 'bar');
    if (!ticket) throw new Error('bar ticket missing');
    return ticket;
  }

  function connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const socket = io(`http://127.0.0.1:${httpPort(app)}/staff`, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 4_000,
        auth: { token: accessToken },
        extraHeaders: { origin: 'http://localhost:3000' },
      });
      socket.once('connect', () => {
        sockets.push(socket);
        resolve(socket);
      });
      socket.once('connect_error', (error) => {
        socket.close();
        reject(error);
      });
    });
  }
});

async function waitFor(events: unknown[], count: number): Promise<void> {
  const started = Date.now();
  while (events.length < count && Date.now() - started < 2_000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
