import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { VENUE_SETTINGS_CHANGED, type MenuItem, type Order } from '@bar/contracts';
import pg from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { MenuCategory } from '../src/modules/menu/infrastructure/persistence/menu-category.entity.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { CustomerOrderCallStaff1763000000000 } from '../src/providers/database/migrations/1763000000000-CustomerOrderCallStaff.js';
import { GuestSession1762900000000 } from '../src/providers/database/migrations/1762900000000-GuestSession.js';
import { CustomerPayment1763100000000 } from '../src/providers/database/migrations/1763100000000-CustomerPayment.js';
import { UpdatedAtTrigger1762500000000 } from '../src/providers/database/migrations/1762500000000-UpdatedAtTrigger.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const TRIGGERED_TABLES = [
  'venue',
  'table_seat',
  'visit',
  'staff_user',
  'menu_category',
  'menu_item',
  'menu_item_availability',
  'menu_item_variant',
  'modifier_group',
  'modifier_option',
  'order_record',
  'order_ticket',
  'order_item',
  'payment',
  'guest_session',
];

describe('Database-owned updated_at (e2e, DR-023)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await app.get(RedisService).client.flushdb();
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    const staffId = await insertStaff(dataSource, 'Owner');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('attaches the trigger to the 15 tables that have updated_at', async () => {
    const rows: Array<{ tgname: string }> = await dataSource.query(
      `SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'trg\\_%\\_updated\\_at' ORDER BY tgname`,
    );
    expect(rows.map((row) => row.tgname)).toEqual(TRIGGERED_TABLES.map((table) => `trg_${table}_updated_at`).sort());
  });

  describe('AC-1: every writer ends with the database time', () => {
    it.each([
      ['TypeORM save()', async (id: string) => {
        const categories = dataSource.getRepository(MenuCategory);
        const category = await categories.findOneByOrFail({ id });
        category.name = 'ผ่านออร์ม';
        await categories.save(category);
      }],
      ['raw SQL', async (id: string) => {
        await dataSource.query(`UPDATE menu_category SET name = 'ผ่าน SQL' WHERE id = $1`, [id]);
      }],
      ['raw SQL that sets updated_at to the past', async (id: string) => {
        await dataSource.query(`UPDATE menu_category SET name = 'ย้อนเวลา', updated_at = '2000-01-01' WHERE id = $1`, [id]);
      }],
      ['raw SQL that sets updated_at to the future', async (id: string) => {
        await dataSource.query(`UPDATE menu_category SET updated_at = '2999-01-01' WHERE id = $1`, [id]);
      }],
    ])('%s', async (_label, write) => {
      const id = await anyCategory();
      const before = await stamp('menu_category', id);

      await write(id);

      const after = await stamp('menu_category', id);
      expect(after.getTime()).toBeGreaterThan(before.getTime());
      expect(after.getTime()).toBeLessThan(Date.now() + 5_000);
    });

    it('moves forward by at least 1 ms even inside one transaction', async () => {
      const id = await anyCategory();
      const stamps = await dataSource.transaction(async (manager) => {
        const seen: Date[] = [];
        for (const name of ['หนึ่ง', 'สอง', 'สาม']) {
          await manager.query(`UPDATE menu_category SET name = $2 WHERE id = $1`, [id, name]);
          seen.push(await stamp('menu_category', id, manager));
        }
        return seen;
      });
      expect(stamps[1]!.getTime()).toBeGreaterThan(stamps[0]!.getTime());
      expect(stamps[2]!.getTime()).toBeGreaterThan(stamps[1]!.getTime());
    });
  });

  it('AC-2: an overlapping transaction that locks the row second still stamps later', async () => {
    const id = await anyCategory();
    const first = await connect();
    const second = await connect();
    try {
      await first.query('BEGIN');
      await first.query('SELECT now()');
      await new Promise((resolve) => setTimeout(resolve, 20));
      await second.query('BEGIN');
      await second.query(`UPDATE menu_category SET name = 'สอง' WHERE id = $1`, [id]);
      await second.query('COMMIT');
      const secondStamp = await stamp('menu_category', id);

      await first.query(`UPDATE menu_category SET name = 'หนึ่ง' WHERE id = $1`, [id]);
      await first.query('COMMIT');

      expect((await stamp('menu_category', id)).getTime()).toBeGreaterThan(secondStamp.getTime());
    } finally {
      await first.end();
      await second.end();
    }
  });

  describe('AC-4: the updatedAt the API returns is the stored one', () => {
    it('menu PATCH', async () => {
      const item = await firstMenuItem();
      const patched = await request(app.getHttpServer())
        .patch(`/api/menu/items/${item.id}`)
        .set(auth())
        .send(edit(item, { name: `${item.name} (แก้)` }))
        .expect(200);
      const returned = (patched.body.data as MenuItem).updatedAt;

      expect(returned).not.toBe(item.updatedAt);
      expect(returned).toBe((await stamp('menu_item', item.id)).toISOString());
    });

    it('menu availability toggle (86)', async () => {
      const item = await firstMenuItem();
      const toggled = await request(app.getHttpServer())
        .post(`/api/menu/items/${item.id}/mark-unavailable`)
        .set(auth())
        .expect(200);

      expect(toggled.body.data.item.updatedAt).toBe((await stamp('menu_item', item.id)).toISOString());
      expect(toggled.body.data.item.updatedAt).not.toBe(item.updatedAt);
    });

    it('ticket status change — REST response and order.* WS payload', async () => {
      const emit = vi.spyOn(app.get(NotificationsService), 'emitToStaff');
      const ticket = (await placeOn('T1')).tickets[0];
      if (!ticket) throw new Error('ticket missing');

      const accepted = await request(app.getHttpServer()).post(`/api/tickets/${ticket.id}/accept`).set(auth()).expect(200);

      const stored = (await stamp('order_ticket', ticket.id)).toISOString();
      expect(accepted.body.data.updatedAt).toBe(stored);
      const payload = emit.mock.calls.find(([event]) => event === 'ticket.status_changed')?.[1] as { updatedAt: string };
      expect(payload.updatedAt).toBe(stored);
    });

    it('venue settings update — settings_changed payload', async () => {
      const emit = vi.spyOn(app.get(NotificationsService), 'emitToStaff');
      await request(app.getHttpServer()).patch('/api/venue/settings').set(auth()).send({ kitchenDisplayEnabled: true }).expect(200);

      const payload = emit.mock.calls.find(([event]) => event === VENUE_SETTINGS_CHANGED)?.[1] as { updatedAt: string };
      const rows: Array<{ updated_at: Date }> = await dataSource.query(`SELECT updated_at FROM venue`);
      expect(payload.updatedAt).toBe(rows[0]?.updated_at.toISOString());
    });
  });

  it('AC-5: revert drops the 15 triggers and the function, run brings them back', async () => {
    const migration = new UpdatedAtTrigger1762500000000();
    const guestSession = new GuestSession1762900000000();
    const customerOrder = new CustomerOrderCallStaff1763000000000();
    const customerPayment = new CustomerPayment1763100000000();
    const runner = dataSource.createQueryRunner();
    try {
      // guest_session's trigger depends on the function, so it goes first and comes back last.
      await customerPayment.down(runner); // payment points at guest_session too
      await customerOrder.down(runner); // order_record points at guest_session
      await guestSession.down(runner);
      await migration.down(runner);
      expect(await triggerCount()).toBe(0);
      expect(await dataSource.query(`SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'`)).toHaveLength(0);

      await migration.up(runner);
      await guestSession.up(runner);
      await customerOrder.up(runner);
      await customerPayment.up(runner);
      expect(await triggerCount()).toBe(TRIGGERED_TABLES.length);
    } finally {
      await runner.release();
    }
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async function triggerCount(): Promise<number> {
    const rows: Array<{ n: string }> = await dataSource.query(
      `SELECT COUNT(*) AS n FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'trg\\_%\\_updated\\_at'`,
    );
    return Number(rows[0]?.n);
  }

  async function stamp(
    table: string,
    id: string,
    runner: Pick<DataSource, 'query'> = dataSource,
  ): Promise<Date> {
    const rows: Array<{ updated_at: Date }> = await runner.query(`SELECT updated_at FROM ${table} WHERE id = $1`, [id]);
    if (!rows[0]) throw new Error(`${table} ${id} missing`);
    return rows[0].updated_at;
  }

  async function anyCategory(): Promise<string> {
    const rows: Array<{ id: string }> = await dataSource.query(`SELECT id FROM menu_category LIMIT 1`);
    if (!rows[0]) throw new Error('no category seeded');
    return rows[0].id;
  }

  async function connect(): Promise<pg.Client> {
    const client = new pg.Client({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });
    await client.connect();
    return client;
  }

  async function firstMenuItem(): Promise<MenuItem> {
    const listed = await request(app.getHttpServer()).get('/api/menu/items').set(auth()).expect(200);
    const item = (listed.body.data.items as MenuItem[])[0];
    if (!item) throw new Error('no menu item seeded');
    return item;
  }

  async function placeOn(label: string): Promise<Order> {
    const seats: Array<{ id: string }> = await dataSource.query(`SELECT id FROM table_seat WHERE label = $1`, [label]);
    const opened = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์' LIMIT 1`,
    );
    const placed = await request(app.getHttpServer())
      .post(`/api/visits/${opened.body.data.visit.id}/orders`)
      .set(auth())
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);
    return placed.body.data as Order;
  }
});

function edit(item: MenuItem, overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    itemType: item.itemType,
    station: item.station,
    isPromo: item.isPromo,
    variants: item.variants.filter((v) => v.isAvailable).map((v) => ({ id: v.id, name: v.name, price: v.price })),
    updatedAt: item.updatedAt,
    ...overrides,
  };
}
