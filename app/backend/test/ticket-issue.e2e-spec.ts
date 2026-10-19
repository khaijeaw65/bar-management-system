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

const UNKNOWN = '00000000-0000-4000-8000-000000000099';

describe('Ticket issues (e2e)', () => {
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

  it('flags pending, accepted, and ready tickets and emits one status change', async () => {
    const pending = await placeOn('T1');
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('ticket.status_changed', (payload) => events.push(payload));
    const flagged = await flag(pending, { reason: 'out_of_stock', itemId: lineId(pending) });
    expect(flagged.status).toBe('issue');
    expect(flagged.issue).toMatchObject({
      reason: 'out_of_stock',
      itemId: lineId(pending),
      note: null,
      reportedBy: { displayName: 'เอ' },
      escalatedAt: null,
    });
    await waitFor(events, 1);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ ticketId: pending.id, status: 'issue' });

    const accepted = await placeOn('T2');
    await post(`/api/tickets/${accepted.id}/accept`).expect(200);
    const noted = await flag(accepted, { reason: 'other', note: '  แก้วแตก  ' });
    expect(noted.issue).toMatchObject({ reason: 'other', itemId: null, note: 'แก้วแตก' });

    await dataSource.query(`UPDATE venue SET kitchen_display_enabled = true`);
    const ready = await placeOn('T3');
    await post(`/api/tickets/${ready.id}/accept`).expect(200);
    await post(`/api/tickets/${ready.id}/ready`).expect(200);
    const held = await flag(ready, { reason: 'equipment' });
    expect(held.status).toBe('issue');
    expect(held.issue?.reason).toBe('equipment');
  });

  it('rejects a missing note, a bad line, and a flag from a closed ticket', async () => {
    const ticket = await placeOn('C1');
    const bare = await post(`/api/tickets/${ticket.id}/flag-issue`, { reason: 'other' });
    expect(bare.status).toBe(400);
    expect(bare.body.code).toBe('VALIDATION_ERROR');

    const other = await placeOn('C2');
    const foreign = await post(`/api/tickets/${ticket.id}/flag-issue`, {
      reason: 'out_of_stock',
      itemId: lineId(other),
    });
    expect(foreign.status).toBe(400);
    expect(foreign.body.code).toBe('VALIDATION_ERROR');

    await dataSource.query(`UPDATE order_item SET cancelled_at = NOW() WHERE id = $1`, [lineId(ticket)]);
    const cancelledLine = await post(`/api/tickets/${ticket.id}/flag-issue`, {
      reason: 'out_of_stock',
      itemId: lineId(ticket),
    });
    expect(cancelledLine.status).toBe(400);

    const sent = await placeOn('C3');
    await post(`/api/tickets/${sent.id}/accept`).expect(200);
    await post(`/api/tickets/${sent.id}/send`).expect(200);
    expect((await post(`/api/tickets/${sent.id}/flag-issue`, { reason: 'equipment' })).status).toBe(409);

    await dataSource.query(`UPDATE order_ticket SET status = 'cancelled' WHERE id = $1`, [other.id]);
    expect((await post(`/api/tickets/${other.id}/flag-issue`, { reason: 'equipment' })).status).toBe(409);

    const issue = await placeOn('C4');
    await flag(issue, { reason: 'equipment' });
    expect((await post(`/api/tickets/${issue.id}/flag-issue`, { reason: 'equipment' })).status).toBe(409);
    expect((await post(`/api/tickets/${UNKNOWN}/flag-issue`, { reason: 'equipment' })).status).toBe(404);
  });

  it('escalates once onto the POS list, then substitute clears it', async () => {
    const ticket = await placeOn('T4');
    await flag(ticket, { reason: 'out_of_stock', itemId: lineId(ticket) });
    const before = await get(`/api/tickets?escalated=true`).expect(200);
    expect(before.body.data.items).toEqual([]);

    const socket = await connect();
    const statusEvents: unknown[] = [];
    const escalatedEvents: unknown[] = [];
    socket.on('ticket.status_changed', (payload) => statusEvents.push(payload));
    socket.on('ticket.issue_escalated', (payload) => escalatedEvents.push(payload));

    const escalated = await resolve(ticket.id, { resolution: 'escalate' });
    expect(escalated.status).toBe('issue');
    expect(escalated.issue?.escalatedAt).toEqual(expect.any(String));
    await waitFor(escalatedEvents, 1);
    expect(escalatedEvents).toHaveLength(1);
    expect(statusEvents).toHaveLength(0);
    expect(escalatedEvents[0]).toMatchObject({
      ticketId: ticket.id,
      orderId: ticket.orderId,
      visitId: ticket.visitId,
      orderNumber: ticket.orderNumber,
      seatLabel: 'T4',
      reason: 'out_of_stock',
      escalatedBy: { displayName: 'เอ' },
    });

    const again = await post(`/api/tickets/${ticket.id}/resolve`, { resolution: 'escalate' });
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      message: 'ใบงานนี้ส่งให้ POS แล้ว',
    });

    const listed = await get(`/api/tickets?escalated=true&visitId=${ticket.visitId}`).expect(200);
    expect(listed.body.data.items.map((item: Ticket) => item.id)).toEqual([ticket.id]);

    const fixed = await resolve(ticket.id, { resolution: 'substitute' });
    expect(fixed.status).toBe('accepted');
    expect(fixed.issue).toBeNull();
    await waitFor(statusEvents, 1);
    expect(statusEvents).toHaveLength(1);
    expect(escalatedEvents).toHaveLength(1);
    const gone = await get(`/api/tickets?escalated=true`).expect(200);
    expect(gone.body.data.items).toEqual([]);

    const refused = await post(`/api/tickets/${ticket.id}/resolve`, { resolution: 'substitute' });
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('lets one of two substitutes win, and serializes a flag against accept and send', async () => {
    const ticket = await placeOn('T5');
    await flag(ticket, { reason: 'equipment' });
    const [first, second] = await Promise.all([
      post(`/api/tickets/${ticket.id}/resolve`, { resolution: 'substitute' }),
      post(`/api/tickets/${ticket.id}/resolve`, { resolution: 'substitute' }),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const after = await reload(ticket);
    expect(after.status).toBe('accepted');
    expect(after.issue).toBeNull();

    const raced = await placeOn('T6');
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('ticket.status_changed', (payload) => events.push(payload));
    const [flagged, accepted] = await Promise.all([
      post(`/api/tickets/${raced.id}/flag-issue`, { reason: 'equipment' }),
      post(`/api/tickets/${raced.id}/accept`),
    ]);
    expect(flagged.status).toBe(200);
    expect([200, 409]).toContain(accepted.status);
    const claimed = await reload(raced);
    expect(claimed.status).toBe('issue');
    expect(claimed.issue?.reason).toBe('equipment');
    await waitUntil(events, (event) => statusOf(event) === 'issue');
    expect(events.some((event) => statusOf(event) === 'issue')).toBe(true);

    const sending = await placeOn('C5');
    await post(`/api/tickets/${sending.id}/accept`).expect(200);
    const [sentFlag, sent] = await Promise.all([
      post(`/api/tickets/${sending.id}/flag-issue`, { reason: 'equipment' }),
      post(`/api/tickets/${sending.id}/send`),
    ]);
    expect([sentFlag.status, sent.status].sort()).toEqual([200, 409]);
    const finished = await reload(sending);
    if (sentFlag.status === 200) {
      expect(finished.status).toBe('issue');
      expect(finished.issue?.reason).toBe('equipment');
    } else {
      expect(finished.status).toBe('sent');
      expect(finished.issue).toBeNull();
    }
  });

  it('leaves order lines and bill totals unchanged', async () => {
    const ticket = await placeOn('C6');
    const before = await moneyOf(ticket);
    await flag(ticket, { reason: 'out_of_stock', itemId: lineId(ticket) });
    await resolve(ticket.id, { resolution: 'escalate' });
    await resolve(ticket.id, { resolution: 'substitute' });
    expect(await moneyOf(ticket)).toEqual(before);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function post(path: string, body?: Record<string, unknown>) {
    const call = request(app.getHttpServer()).post(path).set(auth());
    return body === undefined ? call : call.send(body);
  }

  function get(path: string) {
    return request(app.getHttpServer()).get(path).set(auth());
  }

  async function placeOn(label: string): Promise<Ticket & { visitId: string }> {
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
    const order = response.body.data as Order;
    const ticket = order.tickets.find((item) => item.station === 'bar');
    if (!ticket) throw new Error('bar ticket missing');
    return { ...ticket, visitId: order.visitId };
  }

  async function flag(ticket: Ticket, body: Record<string, unknown>): Promise<Ticket> {
    const response = await post(`/api/tickets/${ticket.id}/flag-issue`, body).expect(200);
    return response.body.data as Ticket;
  }

  async function resolve(id: string, body: Record<string, unknown>): Promise<Ticket> {
    const response = await post(`/api/tickets/${id}/resolve`, body).expect(200);
    return response.body.data as Ticket;
  }

  async function reload(ticket: Ticket): Promise<Ticket> {
    const response = await get(`/api/orders/${ticket.orderId}`).expect(200);
    const order = response.body.data as Order;
    const found = order.tickets.find((item) => item.id === ticket.id);
    if (!found) throw new Error('ticket missing');
    return found;
  }

  async function moneyOf(ticket: Ticket & { visitId: string }): Promise<string> {
    const order = await get(`/api/orders/${ticket.orderId}`).expect(200);
    const visit = await get(`/api/visits/${ticket.visitId}`).expect(200);
    const rows: unknown = await dataSource.query(
      `SELECT id::text, quantity, unit_price_snapshot::text AS price, cancelled_at
       FROM order_item WHERE ticket_id = $1 ORDER BY id`,
      [ticket.id],
    );
    return JSON.stringify({
      items: order.body.data.tickets.map((item: Ticket) => item.items),
      total: order.body.data.total,
      bill: visit.body.data.bill.total,
      rows,
    });
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

function lineId(ticket: Ticket): string {
  const id = ticket.items[0]?.id;
  if (!id) throw new Error('ticket line missing');
  return id;
}

async function waitFor(events: unknown[], count: number): Promise<void> {
  const started = Date.now();
  while (events.length < count && Date.now() - started < 2_000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

function statusOf(event: unknown): string | undefined {
  if (typeof event !== 'object' || event === null || !('status' in event)) return undefined;
  return typeof event.status === 'string' ? event.status : undefined;
}

async function waitUntil(events: unknown[], match: (event: unknown) => boolean): Promise<void> {
  const started = Date.now();
  while (!events.some(match) && Date.now() - started < 2_000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
