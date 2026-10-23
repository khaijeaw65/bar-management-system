import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Order, TicketList } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { OrderLineSnapshots1762400000000 } from '../src/providers/database/migrations/1762400000000-OrderLineSnapshots.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

interface Line {
  variantId: string;
  quantity: number;
  modifierOptionIds?: string[];
}

describe('Order line snapshots (e2e, DR-022)', () => {
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

  it('AC-1: a rename changes new orders only — old order, tickets and bill keep the old names', async () => {
    const visitId = await openSeat('T1');
    const placed = await place(visitId, [await fancyDouble('เชอร์รี่')]);
    expect(lineNames(placed)).toEqual([{ name: 'โอลด์แฟชั่น', variant: 'ดับเบิล', modifiers: ['ปกติ', 'เชอร์รี่'].sort() }]);

    await dataSource.query(`UPDATE menu_item SET name = 'โอลด์แฟชั่น (ใหม่)' WHERE name = 'โอลด์แฟชั่น'`);
    await dataSource.query(`UPDATE menu_item_variant SET name = 'แก้วใหญ่' WHERE name = 'ดับเบิล'`);
    await dataSource.query(`UPDATE modifier_option SET name = 'เชอร์รี่แดง' WHERE name = 'เชอร์รี่'`);

    expect(lineNames(await getOrder(placed.id))).toEqual(lineNames(placed));
    const bill = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
    expect(lineNames(bill.body.data.orders[0] as Order)).toEqual(lineNames(placed));
    const queue = await request(app.getHttpServer()).get('/api/tickets').set(auth()).expect(200);
    const names = (queue.body.data as TicketList).items.flatMap((ticket) => ticket.items.map((item) => item.name));
    expect(names).toEqual(['โอลด์แฟชั่น']);

    const fresh = await place(visitId, [await fancyDouble('เชอร์รี่แดง')]);
    expect(lineNames(fresh)).toEqual([
      { name: 'โอลด์แฟชั่น (ใหม่)', variant: 'แก้วใหญ่', modifiers: ['ปกติ', 'เชอร์รี่แดง'].sort() },
    ]);
  });

  it('AC-3: five lines read back in request order on every read', async () => {
    const visitId = await openSeat('T2');
    const requested = ['ลีโอขวด', 'ช้างดราฟต์', 'เนโกรนี', 'ไฮบอลมะนาวโซดา', 'สิงห์ดราฟต์'];
    const placed = await place(visitId, await Promise.all(requested.map((name) => lineOf(name))));

    const stored: Array<{ line_no: number; item_name_snapshot: string }> = await dataSource.query(
      `SELECT i.line_no, i.item_name_snapshot
       FROM order_item i JOIN order_ticket t ON t.id = i.ticket_id
       WHERE t.order_id = $1 ORDER BY i.line_no`,
      [placed.id],
    );
    expect(stored.map((row) => row.line_no)).toEqual([1, 2, 3, 4, 5]);
    expect(stored.map((row) => row.item_name_snapshot)).toEqual(requested);

    const reference = JSON.stringify(await getOrder(placed.id));
    for (let read = 0; read < 20; read += 1) {
      expect(JSON.stringify(await getOrder(placed.id))).toBe(reference);
    }
    expect((await getOrder(placed.id)).tickets[0]?.items.map((item) => item.name)).toEqual(requested);
  });

  it('AC-2: the migration backfills existing rows with the names at migration time, and down then up runs again', async () => {
    const visitId = await openSeat('T3');
    const lines = [await fancyDouble('เชอร์รี่'), await lineOf('ช้างดราฟต์')];
    const first = await place(visitId, lines);
    await place(visitId, [await lineOf('ถั่วทอดสมุนไพร')]);

    const runner = dataSource.createQueryRunner();
    const migration = new OrderLineSnapshots1762400000000();
    try {
      await migration.down(runner);
      await dataSource.query(`UPDATE menu_item SET name = 'ช้างดราฟต์ (ถัง)' WHERE name = 'ช้างดราฟต์'`);
      await migration.up(runner);
      await migration.down(runner);
      await migration.up(runner);
    } finally {
      await runner.release();
    }

    const items: Array<{ item: string; variant: string; line_no: number; order_id: string }> = await dataSource.query(
      `SELECT i.item_name_snapshot AS item, i.variant_name_snapshot AS variant, i.line_no, t.order_id
       FROM order_item i JOIN order_ticket t ON t.id = i.ticket_id
       ORDER BY t.order_id, i.line_no`,
    );
    // Lines of one order share created_at, so the backfill order inside it is arbitrary — only 1 … n is guaranteed.
    expect(items.map((row) => `${row.item}/${row.variant}`).sort()).toEqual(
      ['ช้างดราฟต์ (ถัง)/ปกติ', 'ถั่วทอดสมุนไพร/ปกติ', 'โอลด์แฟชั่น/ดับเบิล'].sort(),
    );
    expect(lineNumbers(items, first.id)).toEqual([1, 2]);
    expect(items.filter((row) => row.order_id !== first.id).map((row) => row.line_no)).toEqual([1]);
    const modifiers: Array<{ name: string }> = await dataSource.query(
      `SELECT option_name_snapshot AS name FROM order_item_modifier ORDER BY option_name_snapshot`,
    );
    expect(modifiers.map((row) => row.name).sort()).toEqual(['ปกติ', 'เชอร์รี่'].sort());
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async function openSeat(label: string): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(`SELECT id FROM table_seat WHERE label = $1`, [label]);
    const response = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    return response.body.data.visit.id as string;
  }

  async function place(visitId: string, items: Line[]): Promise<Order> {
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items })
      .expect(201);
    return response.body.data as Order;
  }

  async function getOrder(id: string): Promise<Order> {
    const response = await request(app.getHttpServer()).get(`/api/orders/${id}`).set(auth()).expect(200);
    return response.body.data as Order;
  }

  async function lineOf(name: string): Promise<Line> {
    const rows: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id
       WHERE i.name = $1 AND v.name = 'ปกติ'`,
      [name],
    );
    return { variantId: rows[0]?.id ?? '', quantity: 1 };
  }

  /** The seeded double old fashioned with the required ice option and one add-on. */
  async function fancyDouble(addOn: string): Promise<Line> {
    const rows: Array<{ variant: string; ice: string; extra: string }> = await dataSource.query(
      `SELECT v.id AS variant,
              (SELECT id FROM modifier_option WHERE name = 'ปกติ' AND group_id IN (SELECT id FROM modifier_group WHERE name = 'น้ำแข็ง')) AS ice,
              (SELECT id FROM modifier_option WHERE name = $1) AS extra
       FROM menu_item_variant v
       WHERE v.name IN ('ดับเบิล', 'แก้วใหญ่')`,
      [addOn],
    );
    const row = rows[0];
    return { variantId: row?.variant ?? '', quantity: 1, modifierOptionIds: [row?.ice ?? '', row?.extra ?? ''] };
  }
});

function lineNumbers(items: Array<{ line_no: number; order_id: string }>, orderId: string): number[] {
  return items.filter((row) => row.order_id === orderId).map((row) => row.line_no);
}

function lineNames(order: Order): Array<{ name: string; variant: string; modifiers: string[] }> {
  return order.tickets
    .flatMap((ticket) => ticket.items)
    .map((item) => ({
      name: item.name,
      variant: item.variantName,
      modifiers: item.modifiers.map((modifier) => modifier.name).sort(),
    }));
}
