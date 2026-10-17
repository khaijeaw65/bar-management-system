import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TableList } from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import {
  clearStaffAndVenue,
  httpPort,
  insertStaff,
  staffSession,
} from './staff-session.js';

const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Venue (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let staffId: string;
  const sockets: Socket[] = [];

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
    await closeSockets();
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await closeSockets();
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    staffId = await insertStaff(dataSource, 'Owner');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
  });

  it('lists counters before tables, with a live visit only on an open seat', async () => {
    const seats = await seatRows();
    const counter = seats.find((seat) => seat.label === 'C1');
    if (!counter) throw new Error('C1 missing');
    await openSeat(counter.id, { guestLabel: 'พี่เอก' }).expect(201);

    const body = await listTables();
    expect(body.items.map((seat) => seat.label)).toEqual([
      'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
      'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    ]);
    expect(body.items.map((seat) => seat.kind)).toEqual([
      ...Array(8).fill('counter'),
      ...Array(6).fill('table'),
    ]);
    const open = body.items[0]?.currentVisit;
    expect(open).toMatchObject({
      state: 'open',
      guestLabel: 'พี่เอก',
      total: '0.00',
      itemCount: 0,
      staffCalled: false,
    });
    expect(body.items[1]?.currentVisit).toBeNull();
  });

  it('opens a free seat, emits visit.opened, and reads the header', async () => {
    const socket = await connect();
    const opened = once(socket, 'visit.opened');
    const seat = await seatByLabel('T3');
    const response = await openSeat(seat.id, { via: 'app' }).expect(201);

    expect(response.body).toMatchObject({
      status: 201,
      code: '',
      message: 'success',
      data: {
        attached: false,
        visit: {
          state: 'open',
          seatLabel: 'T3',
          seatKind: 'table',
          openedVia: 'app',
          openedBy: { staffId, displayName: 'Owner' },
          guestLabel: null,
          closedAt: null,
        },
      },
    });
    const payload = await opened;
    expect(payload).toMatchObject({
      id: seat.id,
      label: 'T3',
      currentVisit: { state: 'open', total: '0.00' },
    });

    const visitId = response.body.data.visit.id as string;
    const header = await request(app.getHttpServer())
      .get(`/api/visits/${visitId}`)
      .set(auth())
      .expect(200);
    expect(header.body.data.seatLabel).toBe('T3');
  });

  it('resolves a concurrent open to one visit and one event', async () => {
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('visit.opened', (payload) => events.push(payload));
    const seat = await seatByLabel('C4');

    const [first, second] = await Promise.all([
      openSeat(seat.id, { via: 'pos', guestLabel: 'เอ' }),
      openSeat(seat.id, { via: 'app', guestLabel: 'บี' }),
    ]);
    const responses = [first, second];
    const created = responses.find((item) => item.status === 201);
    const attached = responses.find((item) => item.status === 200);
    if (!created || !attached) {
      throw new Error(`expected 201 and 200, got ${responses.map((item) => item.status)}`);
    }

    expect(created.body.data.attached).toBe(false);
    expect(attached.body.data.attached).toBe(true);
    expect(attached.body.data.visit.id).toBe(created.body.data.visit.id);
    expect(attached.body.data.visit.openedBy).toEqual({
      staffId,
      displayName: 'Owner',
    });
    expect(attached.body.data.visit.openedVia).toBe(
      created.body.data.visit.openedVia,
    );
    const rows: Array<{ count: string }> = await dataSource.query(
      `SELECT count(*) FROM visit WHERE table_seat_id = $1`,
      [seat.id],
    );
    expect(Number(rows[0]?.count)).toBe(1);
    await expectOneEvent(events);
  });

  it('closes a visit, clears the seat, and rejects a second close', async () => {
    const socket = await connect();
    const changed = once(socket, 'visit.state_changed');
    const seat = await seatByLabel('T1');
    const opened = await openSeat(seat.id).expect(201);
    const visitId = opened.body.data.visit.id as string;

    const closed = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set(auth())
      .expect(200);
    expect(closed.body.data).toMatchObject({
      id: visitId,
      state: 'closed',
    });
    expect(closed.body.data.closedAt).toEqual(expect.any(String));
    expect(await changed).toEqual({
      visitId,
      tableSeatId: seat.id,
      state: 'closed',
    });

    const listed = await listTables();
    expect(listed.items.find((item) => item.id === seat.id)?.currentVisit).toBeNull();

    const again = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set(auth())
      .expect(409);
    expect(again.body).toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      message: 'สถานะโต๊ะไม่ถูกต้อง',
      data: null,
    });

    const reopened = await openSeat(seat.id).expect(201);
    expect(reopened.body.data.visit.id).not.toBe(visitId);
  });

  it('lets one of two concurrent closes win', async () => {
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('visit.state_changed', (payload) => events.push(payload));
    const seat = await seatByLabel('T2');
    const opened = await openSeat(seat.id).expect(201);
    const visitId = opened.body.data.visit.id as string;

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post(`/api/visits/${visitId}/close`).set(auth()),
      request(app.getHttpServer()).post(`/api/visits/${visitId}/close`).set(auth()),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
    const failed = [first, second].find((item) => item.status === 409);
    expect(failed?.body.code).toBe('INVALID_STATE_TRANSITION');
    await expectOneEvent(events);
  });

  it('replaces the QR token and forgets the old one', async () => {
    const seat = await seatByLabel('C8');
    const before = await tokenOf(seat.id);
    const response = await request(app.getHttpServer())
      .post(`/api/tables/${seat.id}/qr/regenerate`)
      .set(auth())
      .expect(200);
    const qrToken = response.body.data.qrToken as string;

    expect(qrToken).not.toBe(before);
    expect(await tokenOf(seat.id)).toBe(qrToken);
    const old: Array<{ count: string }> = await dataSource.query(
      `SELECT count(*) FROM table_seat WHERE qr_token = $1`,
      [before],
    );
    expect(Number(old[0]?.count)).toBe(0);
  });

  it('returns not found and validation errors in the envelope', async () => {
    const missingSeat = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: UNKNOWN_ID })
      .expect(404);
    expect(missingSeat.body.code).toBe('NOT_FOUND');

    const missingVisit = await request(app.getHttpServer())
      .get(`/api/visits/${UNKNOWN_ID}`)
      .set(auth())
      .expect(404);
    expect(missingVisit.body.code).toBe('NOT_FOUND');

    const invalid = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ via: 'qr' })
      .expect(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function openSeat(tableSeatId: string, extra: Record<string, string> = {}) {
    return request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId, ...extra });
  }

  async function listTables(): Promise<TableList> {
    const response = await request(app.getHttpServer())
      .get('/api/tables')
      .set(auth())
      .expect(200);
    return response.body.data as TableList;
  }

  async function seatRows(): Promise<Array<{ id: string; label: string }>> {
    return dataSource.query(`SELECT id, label FROM table_seat ORDER BY label`);
  }

  async function seatByLabel(label: string): Promise<{ id: string; label: string }> {
    const seat = (await seatRows()).find((item) => item.label === label);
    if (!seat) throw new Error(`${label} missing`);
    return seat;
  }

  async function tokenOf(id: string): Promise<string> {
    const rows: Array<{ qr_token: string }> = await dataSource.query(
      `SELECT qr_token FROM table_seat WHERE id = $1`,
      [id],
    );
    const token = rows[0]?.qr_token;
    if (!token) throw new Error('qr token missing');
    return token;
  }

  async function connect(): Promise<Socket> {
    const socket = await connectStaff(httpPort(app), accessToken);
    sockets.push(socket);
    return socket;
  }

  async function closeSockets(): Promise<void> {
    for (const socket of sockets) socket.close();
    sockets.length = 0;
  }
});

function connectStaff(port: number, token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(`http://127.0.0.1:${port}/staff`, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 4_000,
      auth: { token },
      extraHeaders: { origin: 'http://localhost:3000' },
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => {
      socket.close();
      reject(error);
    });
  });
}

async function expectOneEvent(events: unknown[]): Promise<void> {
  const started = Date.now();
  while (events.length === 0 && Date.now() - started < 2_000) {
    await delay(20);
  }
  expect(events).toHaveLength(1);
  await delay(150);
  expect(events).toHaveLength(1);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function once(socket: Socket, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for ${event}`)),
      4_000,
    );
    socket.once(event, (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

