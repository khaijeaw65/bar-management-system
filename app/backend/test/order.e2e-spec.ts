import './set-auth-env.js';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Order, TicketList } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';

interface VariantRow {
  itemId: string;
  variantId: string;
  name: string;
  itemType: string;
  kitchenTag: string | null;
  price: string;
}

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

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
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    const staffId = await insertStaff(dataSource, 'Owner');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('splits beer, food, and corkage when the kitchen screen is off', async () => {
    const visitId = await openSeat('T1');
    const order = await place(visitId, await sampleLines());

    expect(order.orderNumber).toBe(1);
    expect(order.tickets).toHaveLength(2);
    const bar = order.tickets.find((ticket) => ticket.station === 'bar');
    const charge = order.tickets.find((ticket) => ticket.station === null);
    expect(bar).toMatchObject({ status: 'pending', sentAt: null });
    expect(bar?.items.map((item) => item.name)).toEqual(expect.arrayContaining(['ถั่วทอดสมุนไพร', 'ช้างดราฟต์']));
    expect(bar?.items).toHaveLength(2);
    expect(charge).toMatchObject({ status: 'sent' });
    expect(charge?.sentAt).toEqual(expect.any(String));
    expect(charge?.items[0]).toMatchObject({ name: 'ค่าเปิดขวด', unitPrice: '300.00', lineTotal: '300.00' });
    expect(order.total).toBe('500.00');
  });

  it('splits bar and food when the kitchen screen is on', async () => {
    await dataSource.query(`UPDATE venue SET kitchen_display_enabled = true`);
    const order = await place(await openSeat('T1'), await sampleLines());
    expect(order.tickets).toHaveLength(3);
    expect(order.tickets.map((ticket) => ticket.station)).toEqual(expect.arrayContaining([null, 'bar', 'food']));
    expect(order.tickets.find((ticket) => ticket.station === 'food')?.items[0]?.name).toBe('ถั่วทอดสมุนไพร');
  });

  it('stores blank orderedByName and notes as null', async () => {
    const visitId = await openSeat('T3');
    const line = await one('ช้างดราฟต์');
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ ...line, orderedByName: '   ', notes: '   ' }] })
      .expect(201);
    const order = response.body.data as Order;
    const item = order.tickets.flatMap((ticket) => ticket.items).find((row) => row.variantId === line.variantId);
    expect(item).toMatchObject({ orderedByName: null, notes: null });
    const stored: Array<{ ordered_by_name: string | null; notes: string | null }> = await dataSource.query(
      `SELECT ordered_by_name, notes FROM order_item WHERE id = $1`,
      [item?.id],
    );
    expect(stored).toEqual([{ ordered_by_name: null, notes: null }]);
  });

  it('activates an open visit once and rejects a closed visit', async () => {
    const visitId = await openSeat('T2');
    const first = await place(visitId, await sampleLines());
    const visit = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
    expect(visit.body.data.state).toBe('active');
    expect(visit.body.data.orders).toHaveLength(1);
    expect(visit.body.data.orders[0].id).toBe(first.id);

    const second = await place(visitId, [await one('ช้างดราฟต์')]);
    expect(second.orderNumber).toBe(2);
    await request(app.getHttpServer()).post(`/api/visits/${visitId}/close`).set(auth()).expect(200);
    const rejected = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [await one('ช้างดราฟต์')] });
    expect(rejected.status).toBe(409);
    expect(rejected.body.code).toBe('INVALID_STATE_TRANSITION');
    const rows: Array<{ count: string }> = await dataSource.query(
      `SELECT count(*) FROM order_record WHERE visit_id = $1`,
      [visitId],
    );
    expect(Number(rows[0]?.count)).toBe(2);
  });

  describe('visit activation race', () => {
    it('never stores an order on a visit that closed first', async () => {
      const visitId = await openSeat('T3');
      const lines = [await one('ช้างดราฟต์')];
      const [ordered, closed] = await Promise.all([
        request(app.getHttpServer()).post(`/api/visits/${visitId}/orders`).set(auth()).send({ items: lines }),
        request(app.getHttpServer()).post(`/api/visits/${visitId}/close`).set(auth()),
      ]);
      const count = await orderCount(visitId);
      if (ordered.status === 201) {
        expect(closed.status).toBe(200);
        expect(count).toBe(1);
      } else {
        expect(ordered.status).toBe(409);
        expect(ordered.body.code).toBe('INVALID_STATE_TRANSITION');
        expect(closed.status).toBe(200);
        expect(count).toBe(0);
      }
    });
  });

  describe('order number', () => {
    it('gives five concurrent orders unique consecutive numbers', async () => {
      const labels = ['T1', 'T2', 'T3', 'T4', 'T5'];
      const line = await one('ช้างดราฟต์');
      const responses = await Promise.all(
        labels.map(async (label) => {
          const visitId = await openSeat(label);
          return request(app.getHttpServer())
            .post(`/api/visits/${visitId}/orders`)
            .set(auth())
            .send({ items: [line] });
        }),
      );
      const numbers = responses.map((response) => {
        expect(response.status).toBe(201);
        return response.body.data.orderNumber as number;
      });
      expect(numbers.sort((left, right) => left - right)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  it('rejects an unavailable line and a bad modifier set without writing', async () => {
    const visitId = await openSeat('C1');
    const beer = await named('ช้างดราฟต์');
    await dataSource.query(`UPDATE menu_item SET is_available = false WHERE id = $1`, [beer.itemId]);
    const soldOut = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId: beer.variantId, quantity: 1 }] });
    expect(soldOut.status).toBe(409);
    expect(soldOut.body.code).toBe('ITEM_UNAVAILABLE');
    expect(soldOut.body.data.details).toEqual([{ variantId: beer.variantId, reason: 'sold_out' }]);

    const drink = await named('สิงห์ดราฟต์');
    await dataSource.query(
      `INSERT INTO menu_item_availability (menu_item_id, days_of_week, start_time, end_time)
       VALUES ($1, $2::smallint[], '10:00', '11:00')`,
      [drink.itemId, [otherWeekday()]],
    );
    const closed = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId: drink.variantId, quantity: 1 }] });
    expect(closed.body.code).toBe('ITEM_UNAVAILABLE');
    expect(closed.body.data.details[0].reason).toBe('out_of_window');

    const fancy = await named('โอลด์แฟชั่น');
    const invalid = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId: fancy.variantId, quantity: 1, modifierOptionIds: [UNKNOWN] }] });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');
    expect(await orderCount(visitId)).toBe(0);
  });

  describe('idempotency', () => {
    it('replays the same body and rejects a different one', async () => {
      const visitId = await openSeat('T6');
      const key = randomUUID();
      const items = [await one('ช้างดราฟต์')];
      const first = await request(app.getHttpServer())
        .post(`/api/visits/${visitId}/orders`)
        .set({ ...auth(), 'Idempotency-Key': key })
        .send({ items })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(`/api/visits/${visitId}/orders`)
        .set({ ...auth(), 'Idempotency-Key': key })
        .send({ items })
        .expect(201);
      expect(second.body.data.id).toBe(first.body.data.id);
      expect(await orderCount(visitId)).toBe(1);

      const other = await request(app.getHttpServer())
        .post(`/api/visits/${visitId}/orders`)
        .set({ ...auth(), 'Idempotency-Key': key })
        .send({ items: [await one('สิงห์ดราฟต์')] });
      expect(other.status).toBe(409);
      expect(other.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
      expect(await orderCount(visitId)).toBe(1);
    });
  });

  it('lists the queue, the order, and the table bill', async () => {
    const visitId = await openSeat('T1');
    const created = await place(visitId, await sampleLines());
    const queue = await request(app.getHttpServer()).get('/api/tickets').set(auth()).expect(200);
    const tickets = queue.body.data as TicketList;
    expect(tickets.items.every((ticket) => ticket.station !== null)).toBe(true);
    expect(tickets.items.map((ticket) => ticket.status)).toEqual(['pending']);

    const filtered = await request(app.getHttpServer())
      .get(`/api/tickets?status=sent&visitId=${visitId}`)
      .set(auth())
      .expect(200);
    expect(filtered.body.data.items).toEqual([]);

    const loaded = await request(app.getHttpServer()).get(`/api/orders/${created.id}`).set(auth()).expect(200);
    const order = loaded.body.data as Order;
    expect(order.tickets.some((ticket) => ticket.station === null)).toBe(true);

    const tables = await request(app.getHttpServer()).get('/api/tables').set(auth()).expect(200);
    const seat = tables.body.data.items.find((item: { label: string }) => item.label === 'T1');
    expect(seat.currentVisit).toMatchObject({ total: '500.00', itemCount: 3 });
  });

  it('returns not found and validation errors', async () => {
    const missingVisit = await request(app.getHttpServer())
      .post(`/api/visits/${UNKNOWN}/orders`)
      .set(auth())
      .send({ items: [{ variantId: UNKNOWN, quantity: 1 }] });
    expect(missingVisit.status).toBe(404);
    expect(missingVisit.body.code).toBe('NOT_FOUND');

    const visitId = await openSeat('C2');
    const unknownItem = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId: UNKNOWN, quantity: 1 }] });
    expect(unknownItem.status).toBe(400);

    const badBody = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [] });
    expect(badBody.status).toBe(400);
    expect(badBody.body.code).toBe('VALIDATION_ERROR');

    const missingOrder = await request(app.getHttpServer()).get(`/api/orders/${UNKNOWN}`).set(auth());
    expect(missingOrder.status).toBe(404);
    const missingTicket = await request(app.getHttpServer()).post(`/api/tickets/${UNKNOWN}/accept`).set(auth());
    expect(missingTicket.status).toBe(404);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async function openSeat(label: string): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = $1`,
      [label],
    );
    const seatId = seats[0]?.id;
    if (!seatId) throw new Error(`${label} missing`);
    const response = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: seatId })
      .expect(201);
    return response.body.data.visit.id as string;
  }

  async function place(visitId: string, items: Array<{ variantId: string; quantity: number }>): Promise<Order> {
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items })
      .expect(201);
    return response.body.data as Order;
  }

  async function named(name: string): Promise<VariantRow> {
    const rows: VariantRow[] = await dataSource.query(
      `SELECT i.id AS "itemId", v.id AS "variantId", i.name, i.item_type AS "itemType",
              i.kitchen_tag AS "kitchenTag", v.price
       FROM menu_item i
       JOIN menu_item_variant v ON v.menu_item_id = i.id
       WHERE i.name = $1 AND v.name = 'ปกติ'
       LIMIT 1`,
      [name],
    );
    const row = rows[0];
    if (!row) throw new Error(`${name} missing`);
    return row;
  }

  async function one(name: string): Promise<{ variantId: string; quantity: number }> {
    const row = await named(name);
    return { variantId: row.variantId, quantity: 1 };
  }

  async function sampleLines(): Promise<Array<{ variantId: string; quantity: number }>> {
    return [await one('ช้างดราฟต์'), await one('ถั่วทอดสมุนไพร'), await one('ค่าเปิดขวด')];
  }

  async function orderCount(visitId: string): Promise<number> {
    const rows: Array<{ count: string }> = await dataSource.query(
      `SELECT count(*) FROM order_record WHERE visit_id = $1`,
      [visitId],
    );
    return Number(rows[0]?.count ?? 0);
  }
});

function otherWeekday(): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    weekday: 'short',
  }).format(new Date());
  const today: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const current = today[weekday] ?? 1;
  return current === 1 ? 2 : 1;
}
