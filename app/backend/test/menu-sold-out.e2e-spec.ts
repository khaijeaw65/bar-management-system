import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { MarkAvailabilityResult, Order, Ticket } from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { PERMISSIONS_KEY } from '../src/common/guards/permissions.guard.js';
import { MenuAvailabilityController } from '../src/modules/order/infrastructure/http/menu-availability.controller.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const CANCEL_FAIL = 'brief027_cancel_fail';

interface PricedItem {
  itemId: string;
  variantId: string;
}

describe('Sold-out auto-void (e2e)', () => {
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
    await dataSource.query(`ALTER TABLE order_item DROP CONSTRAINT IF EXISTS ${CANCEL_FAIL}`);
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    for (const socket of sockets) socket.close();
    sockets.length = 0;
    await dataSource.query(`ALTER TABLE order_item DROP CONSTRAINT IF EXISTS ${CANCEL_FAIL}`);
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    const staffId = await insertStaff(dataSource, 'เอ');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    // The catalog seed leaves ยำหมูยอ unavailable so menu reads have a sold-out row. This flow starts from available.
    await dataSource.query(`UPDATE menu_item SET is_available = true WHERE name = 'ยำหมูยอ'`);
    await dataSource.query(
      `UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`,
    );
  });

  it('voids pending lines, cancels an emptied ticket, and reports the rest', async () => {
    const yum = await item('ยำหมูยอ');
    const nuts = await item('ถั่วทอดสมุนไพร');
    const t2 = await open('T2');
    const t5 = await open('T5');
    const t3 = await open('T3');
    const t6 = await open('T6');
    const order2 = await place(t2, [row(yum, 1), row(nuts, 1)]);
    const order5 = await place(t5, [row(yum, 2)]);
    const order3 = await place(t3, [row(yum, 1)]);
    const order6 = await place(t6, [row(yum, 1)]);
    const before = {
      t2: await bill(t2),
      t5: await bill(t5),
      t3: await bill(t3),
      t6: await bill(t6),
    };
    await post(`/api/tickets/${bar(order3).id}/accept`).expect(200);
    await pay(t6).expect(201);

    const socket = await connect();
    const availability: unknown[] = [];
    const statuses: unknown[] = [];
    socket.on('menu.availability_changed', (payload) => availability.push(payload));
    socket.on('ticket.status_changed', (payload) => statuses.push(payload));

    const marked = await mark(yum.itemId).expect(200);
    const body = marked.body.data as MarkAvailabilityResult;
    expect(body.item).toMatchObject({ name: 'ยำหมูยอ', availableNow: false, unavailableReason: 'sold_out' });
    expect(body.autoVoided).toEqual([
      expect.objectContaining({
        ticketId: bar(order2).id,
        orderNumber: order2.orderNumber,
        seatLabel: 'T2',
        itemCount: 1,
        ticketStatus: 'pending',
      }),
      expect.objectContaining({
        ticketId: bar(order5).id,
        orderNumber: order5.orderNumber,
        seatLabel: 'T5',
        itemCount: 2,
        ticketStatus: 'cancelled',
      }),
    ]);
    expect(body.notVoided).toEqual([
      expect.objectContaining({ ticketId: bar(order3).id, seatLabel: 'T3', reason: 'in_progress', itemCount: 1 }),
      expect.objectContaining({ ticketId: bar(order6).id, seatLabel: 'T6', reason: 'payment_pending', itemCount: 1 }),
    ]);
    expect(await bill(t2)).toBe(minus(before.t2, '150.00'));
    expect(await bill(t5)).toBe(minus(before.t5, '300.00'));
    expect(await bill(t3)).toBe(before.t3);
    expect(await bill(t6)).toBe(before.t6);

    const kept = await reload(order2);
    const voidedLine = kept.items.find((line) => line.name === 'ยำหมูยอ');
    const snack = kept.items.find((line) => line.name === 'ถั่วทอดสมุนไพร');
    expect(voidedLine?.cancellation).toMatchObject({ reason: 'ของหมด', by: null, system: true });
    expect(voidedLine?.cancelledAt).toEqual(expect.any(String));
    expect(snack?.cancellation).toBeNull();
    expect(kept.status).toBe('pending');
    expect((await reload(order5)).status).toBe('cancelled');
    expect((await reload(order3)).items[0]?.cancellation).toBeNull();

    await waitFor(availability, 1);
    await waitFor(statuses, 1);
    expect(availability).toEqual([
      expect.objectContaining({
        menuItemId: yum.itemId,
        name: 'ยำหมูยอ',
        isAvailable: false,
        autoVoided: body.autoVoided,
        notVoided: body.notVoided,
      }),
    ]);
    expect(statuses).toEqual([
      expect.objectContaining({
        ticketId: bar(order5).id,
        status: 'cancelled',
        updatedAt: (await reload(order5)).updatedAt,
      }),
    ]);
  });

  it('no-ops an unchanged flag, and mark-available does not restore voided lines', async () => {
    const yum = await item('ยำหมูยอ');
    const visitId = await open('T1');
    const order = await place(visitId, [row(yum, 1)]);
    await dataSource.query(`UPDATE menu_item SET is_available = false WHERE id = $1`, [yum.itemId]);
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('menu.availability_changed', (payload) => events.push(payload));

    const again = await mark(yum.itemId).expect(200);
    expect(again.body.data.autoVoided).toEqual([]);
    expect(again.body.data.notVoided).toEqual([]);
    expect((await reload(order)).items[0]?.cancellation).toBeNull();
    await pause(300);
    expect(events).toHaveLength(0);

    await dataSource.query(`UPDATE menu_item SET is_available = true WHERE id = $1`, [yum.itemId]);
    await mark(yum.itemId).expect(200);
    await waitFor(events, 1);
    const restored = await markAvailable(yum.itemId).expect(200);
    await waitFor(events, 2);
    expect(restored.body.data.item.availableNow).toBe(true);
    expect(restored.body.data.autoVoided).toEqual([]);
    expect((await reload(order)).items[0]?.cancellation).toMatchObject({ system: true, reason: 'ของหมด' });
    const quiet = events.length;
    await markAvailable(yum.itemId).expect(200);
    await pause(300);
    expect(events).toHaveLength(quiet);
  });

  it('rolls the flag back when a line cancel fails, and emits nothing', async () => {
    const yum = await item('ยำหมูยอ');
    const visitId = await open('T1');
    await place(visitId, [row(yum, 1)]);
    const socket = await connect();
    const events: unknown[] = [];
    socket.on('menu.availability_changed', (payload) => events.push(payload));
    await dataSource.query(
      `ALTER TABLE order_item ADD CONSTRAINT ${CANCEL_FAIL} CHECK (cancel_reason IS DISTINCT FROM 'ของหมด')`,
    );
    try {
      const failed = await mark(yum.itemId);
      expect(failed.status).toBe(500);
      const flag: Array<{ is_available: boolean }> = await dataSource.query(
        `SELECT is_available FROM menu_item WHERE id = $1`,
        [yum.itemId],
      );
      expect(flag[0]?.is_available).toBe(true);
      const lines: Array<{ cancelled_at: Date | null }> = await dataSource.query(
        `SELECT cancelled_at FROM order_item`,
      );
      expect(lines.every((line) => line.cancelled_at === null)).toBe(true);
      await pause(300);
      expect(events).toHaveLength(0);
    } finally {
      await dataSource.query(`ALTER TABLE order_item DROP CONSTRAINT IF EXISTS ${CANCEL_FAIL}`);
    }
  });

  it('never leaves a voided line inside a pending payment', async () => {
    const yum = await item('ยำหมูยอ');
    const nuts = await item('ถั่วทอดสมุนไพร');
    const visitId = await open('T1');
    await place(visitId, [row(yum, 1), row(nuts, 1)]);
    const [paid, marked] = await Promise.all([pay(visitId), mark(yum.itemId)]);
    const pending: Array<{ amount: string }> = await dataSource.query(
      `SELECT amount::text AS amount FROM payment WHERE visit_id = $1 AND status = 'pending'`,
      [visitId],
    );
    const voided: unknown[] = await dataSource.query(
      `SELECT i.id FROM order_item i
       JOIN menu_item_variant v ON v.id = i.menu_item_variant_id
       WHERE v.menu_item_id = $1 AND i.cancelled_at IS NOT NULL`,
      [yum.itemId],
    );
    expect(pending.length === 0 || voided.length === 0).toBe(true);
    if (pending.length > 0) {
      expect(marked.body.data.notVoided).toEqual([
        expect.objectContaining({ reason: 'payment_pending', seatLabel: 'T1' }),
      ]);
    } else if (paid.status === 201) {
      expect(paid.body.data.total).toBe('80.00');
    } else {
      expect(paid.status).toBe(409);
    }
  });

  it('does not void a ticket accepted before the toggle, or one that wins the race', async () => {
    const yum = await item('ยำหมูยอ');
    const early = await place(await open('T3'), [row(yum, 1)]);
    await post(`/api/tickets/${bar(early).id}/accept`).expect(200);
    const reported = await mark(yum.itemId).expect(200);
    expect(reported.body.data.notVoided).toEqual([
      expect.objectContaining({ ticketId: bar(early).id, reason: 'in_progress' }),
    ]);
    expect(reported.body.data.autoVoided).toEqual([]);
    expect((await reload(early)).items[0]?.cancellation).toBeNull();

    await dataSource.query(`UPDATE menu_item SET is_available = true WHERE id = $1`, [yum.itemId]);
    const raced = await place(await open('T4'), [row(yum, 1)]);
    const [accepted, marked] = await Promise.all([
      post(`/api/tickets/${bar(raced).id}/accept`),
      mark(yum.itemId),
    ]);
    const status = (await reload(raced)).status;
    const cancelled = (await reload(raced)).items[0]?.cancellation !== null;
    expect(accepted.status === 200 || accepted.status === 409).toBe(true);
    expect(marked.status).toBe(200);
    if (status === 'accepted') {
      expect(cancelled).toBe(false);
      expect(marked.body.data.notVoided).toEqual([
        expect.objectContaining({ ticketId: bar(early).id, seatLabel: 'T3', reason: 'in_progress' }),
        expect.objectContaining({ ticketId: bar(raced).id, seatLabel: 'T4', reason: 'in_progress' }),
      ]);
    } else {
      expect(cancelled).toBe(true);
      expect(status).toBe('cancelled');
      expect(marked.body.data.notVoided).toEqual([
        expect.objectContaining({ ticketId: bar(early).id, seatLabel: 'T3', reason: 'in_progress' }),
      ]);
      expect(marked.body.data.autoVoided).toEqual([
        expect.objectContaining({ ticketId: bar(raced).id, ticketStatus: 'cancelled' }),
      ]);
    }
  });

  it('either voids an order placed during the toggle or rejects it sold out', async () => {
    const yum = await item('ยำหมูยอ');
    const visitId = await open('T1');
    const [ordered, marked] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/visits/${visitId}/orders`)
        .set(auth())
        .send({ items: [row(yum, 1)] }),
      mark(yum.itemId),
    ]);
    expect(marked.status).toBe(200);
    const live: Array<{ count: number }> = await dataSource.query(
      `SELECT count(*)::int AS count
       FROM order_item i
       JOIN menu_item_variant v ON v.id = i.menu_item_variant_id
       JOIN order_ticket t ON t.id = i.ticket_id
       WHERE v.menu_item_id = $1 AND i.cancelled_at IS NULL AND t.status = 'pending'`,
      [yum.itemId],
    );
    expect(Number(live[0]?.count)).toBe(0);
    if (ordered.status === 201) {
      expect(marked.body.data.autoVoided.length).toBeGreaterThan(0);
    } else {
      expect(ordered.status).toBe(409);
      expect(ordered.body.code).toBe('ITEM_UNAVAILABLE');
      expect(ordered.body.data.details).toEqual([{ variantId: yum.variantId, reason: 'sold_out' }]);
    }
  });

  it('rejects an unknown item, a bad id, and declares the permission', async () => {
    expect(await mark(UNKNOWN)).toMatchObject({ status: 404, body: { code: 'NOT_FOUND' } });
    expect((await mark('not-a-uuid')).status).toBe(400);
    const reflector = app.get(Reflector);
    expect(reflector.get(PERMISSIONS_KEY, MenuAvailabilityController.prototype.markUnavailable)).toEqual([
      'menu:toggle_availability',
    ]);
    expect(reflector.get(PERMISSIONS_KEY, MenuAvailabilityController.prototype.markAvailable)).toEqual([
      'menu:toggle_availability',
    ]);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function post(path: string) {
    return request(app.getHttpServer()).post(path).set(auth());
  }

  function mark(itemId: string) {
    return post(`/api/menu/items/${itemId}/mark-unavailable`);
  }

  function markAvailable(itemId: string) {
    return post(`/api/menu/items/${itemId}/mark-available`);
  }

  function pay(visitId: string) {
    return post(`/api/visits/${visitId}/payments`).send({ method: 'promptpay', mode: 'merge' });
  }

  async function open(label: string): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = $1`,
      [label],
    );
    const opened = await post('/api/visits').send({ tableSeatId: seats[0]?.id }).expect(201);
    return opened.body.data.visit.id as string;
  }

  async function item(name: string): Promise<PricedItem> {
    const rows: PricedItem[] = await dataSource.query(
      `SELECT i.id AS "itemId", v.id AS "variantId"
       FROM menu_item i
       JOIN menu_item_variant v ON v.menu_item_id = i.id
       WHERE i.name = $1
       LIMIT 1`,
      [name],
    );
    const found = rows[0];
    if (!found) throw new Error(`missing menu item ${name}`);
    return found;
  }

  async function place(visitId: string, items: Array<{ variantId: string; quantity: number }>): Promise<Order> {
    const response = await post(`/api/visits/${visitId}/orders`).send({ items }).expect(201);
    return response.body.data as Order;
  }

  async function bill(visitId: string): Promise<string> {
    const response = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
    return response.body.data.bill.total as string;
  }

  async function reload(order: Order): Promise<Ticket> {
    const response = await request(app.getHttpServer()).get(`/api/orders/${order.id}`).set(auth()).expect(200);
    const ticket = (response.body.data as Order).tickets.find((entry) => entry.station !== null);
    if (!ticket) throw new Error('ticket missing');
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

function row(priced: PricedItem, quantity: number): { variantId: string; quantity: number } {
  return { variantId: priced.variantId, quantity };
}

function bar(order: Order): Ticket {
  const ticket = order.tickets.find((entry) => entry.station !== null);
  if (!ticket) throw new Error('bar ticket missing');
  return ticket;
}

function minus(total: string, amount: string): string {
  const cents = toCents(total) - toCents(amount);
  const fraction = String(Math.abs(cents) % 100).padStart(2, '0');
  return `${Math.trunc(cents / 100)}.${fraction}`;
}

function toCents(value: string): number {
  const [whole = '0', fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
}

async function waitFor(events: unknown[], count: number): Promise<void> {
  const started = Date.now();
  while (events.length < count && Date.now() - started < 2_000) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
