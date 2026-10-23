import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { CLOCK } from '../src/common/clock.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

// Thursday 15 Oct 2026, 22:00 Bangkok → business date 2026-10-15 (cut-off 06:00).
const NOW = new Date('2026-10-15T22:00:00+07:00');
const DAY_MS = 24 * 3600 * 1000;

function bkk(local: string): Date {
  return new Date(`${local.replace(' ', 'T')}:00+07:00`);
}

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let seats: string[];
  let menu: Record<string, string>;
  let orderNumber = 0;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLOCK)
      .useValue({ now: () => NOW })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await app.get(RedisService).client.flushdb();
    await clearStaffAndVenue(dataSource);
    accessToken = (await staffSession(app, await insertStaff(dataSource, 'เจ้าของ'))).accessToken;
    await seedVenue(dataSource);
    seats = (await dataSource.query(`SELECT id FROM table_seat ORDER BY label`)).map((row: { id: string }) => row.id);
    menu = await insertMenu();
    await insertHistory();
    await insertTonight();
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  describe('GET /reports/summary (AC-1)', () => {
    it('counts payments by business day, skips cancelled payments and ฿0 bills in the average', async () => {
      const summary = await get('/api/reports/summary?from=2026-10-12&to=2026-10-14');
      expect(summary).toEqual({
        from: '2026-10-12',
        to: '2026-10-14',
        revenue: '1500.00',
        bills: 4,
        averageBill: '500.00',
        payments: { promptpay: { amount: '1200.00', count: 2 }, cash: { amount: '300.00', count: 1 } },
        manualConfirmations: 1,
        previous: { from: '2026-10-09', to: '2026-10-11', revenue: '200.00', bills: 1, averageBill: '200.00' },
      });
    });

    it('returns zeros and "0.00" for a period with no bills', async () => {
      const empty = await get('/api/reports/summary?from=2026-09-01&to=2026-09-01');
      expect(empty).toMatchObject({ revenue: '0.00', bills: 0, averageBill: '0.00', manualConfirmations: 0 });
    });
  });

  describe('GET /reports/daily (AC-2)', () => {
    it('lists every date with zeros filled, and the days add up to the summary', async () => {
      const daily = await get('/api/reports/daily?from=2026-10-11&to=2026-10-14');
      expect(daily.items).toEqual([
        { date: '2026-10-11', revenue: '0.00', bills: 0 },
        { date: '2026-10-12', revenue: '500.00', bills: 1 },
        { date: '2026-10-13', revenue: '300.00', bills: 2 },
        { date: '2026-10-14', revenue: '700.00', bills: 1 },
      ]);
      const period = await get('/api/reports/daily?from=2026-10-12&to=2026-10-14');
      const summary = await get('/api/reports/summary?from=2026-10-12&to=2026-10-14');
      const revenue = period.items.reduce((sum: number, day: { revenue: string }) => sum + Number(day.revenue) * 100, 0);
      const bills = period.items.reduce((sum: number, day: { bills: number }) => sum + day.bills, 0);
      expect(revenue).toBe(Number(summary.revenue) * 100);
      expect(bills).toBe(summary.bills);
    });
  });

  describe('GET /reports/items (AC-3)', () => {
    it('top: by revenue, without cancelled lines or charge items', async () => {
      const top = await get('/api/reports/items?from=2026-10-12&to=2026-10-14&sort=top');
      expect(top.items).toEqual([
        { menuItemId: menu.wings, name: 'ปีกไก่', quantity: 4, revenue: '720.00' },
        { menuItemId: menu.beer, name: 'เบียร์', quantity: 3, revenue: '360.00' },
        { menuItemId: menu.fresh, name: 'เมนูใหม่', quantity: 1, revenue: '150.00' },
        { menuItemId: menu.unavailable, name: 'เลิกขาย', quantity: 1, revenue: '90.00' },
      ]);
      const limited = await get('/api/reports/items?from=2026-10-12&to=2026-10-14&sort=top&limit=1');
      expect(limited.items).toHaveLength(1);
    });

    it('bottom: includes a 0-sales item, skips unavailable and week-old items', async () => {
      const bottom = await get('/api/reports/items?from=2026-10-12&to=2026-10-14&sort=bottom');
      expect(bottom.items).toEqual([
        { menuItemId: menu.unsold, name: 'ขายไม่ออก', quantity: 0, revenue: '0.00' },
        { menuItemId: menu.beer, name: 'เบียร์', quantity: 3, revenue: '360.00' },
        { menuItemId: menu.wings, name: 'ปีกไก่', quantity: 4, revenue: '720.00' },
      ]);
    });
  });

  describe('GET /reports/today (AC-4)', () => {
    it('buckets tonight by hour from the cut-off, lists open seats oldest first and counts tickets', async () => {
      const today = await get('/api/reports/today');
      expect(today).toMatchObject({
        businessDate: '2026-10-15',
        revenue: '1250.00',
        bills: 2,
        pendingTickets: 2,
        escalatedIssues: 1,
        generatedAt: NOW.toISOString(),
      });
      expect(today.hourly).toHaveLength(24);
      expect(today.hourly[0]).toEqual({ hour: 6, revenue: '1000.00' });
      expect(today.hourly.find((bucket: { hour: number }) => bucket.hour === 21).revenue).toBe('250.00');
      const hourlyTotal = today.hourly.reduce((sum: number, bucket: { revenue: string }) => sum + Number(bucket.revenue) * 100, 0);
      expect(hourlyTotal).toBe(125_000);
      expect(today.openSeats).toEqual([
        { seatLabel: 'C1', openedAt: bkk('2026-10-15 19:00').toISOString(), total: '440.00' },
        { seatLabel: 'C2', openedAt: bkk('2026-10-15 20:30').toISOString(), total: '300.00' },
      ]);
    });
  });

  describe('validation (AC-5)', () => {
    // No field paths in the envelope (DR-021 B): the shared schema carries them for the UI.
    it.each([
      ['/api/reports/summary?to=2026-10-14', 'วันที่ต้องเป็นรูปแบบ YYYY-MM-DD'],
      ['/api/reports/summary?from=2026-10-14&to=2026-10-12', 'วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น'],
      ['/api/reports/daily?from=2026-01-01&to=2026-04-03', 'ช่วงเวลาต้องไม่เกิน 92 วัน'],
      ['/api/reports/daily?from=2026-10-1&to=2026-10-12', 'วันที่ต้องเป็นรูปแบบ YYYY-MM-DD'],
      ['/api/reports/items?from=2026-10-12&to=2026-10-14&sort=best', 'sort ต้องเป็น top หรือ bottom'],
      ['/api/reports/items?from=2026-10-12&to=2026-10-14&sort=top&limit=0', 'limit ต้องอยู่ระหว่าง 1–20'],
      ['/api/reports/items?from=2026-10-12&to=2026-10-14&sort=top&limit=21', 'limit ต้องอยู่ระหว่าง 1–20'],
    ])('%s → 400 "%s"', async (path, message) => {
      const response = await request(app.getHttpServer()).get(path).set(auth()).expect(400);
      expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', data: null });
      expect(response.body.message).toContain(message);
    });

    it('accepts exactly 92 days', async () => {
      await request(app.getHttpServer()).get('/api/reports/summary?from=2026-07-15&to=2026-10-14').set(auth()).expect(200);
    });
  });

  // ── fixture ──────────────────────────────────────────────────────────────

  async function insertMenu(): Promise<Record<string, string>> {
    const [category] = await dataSource.query(`INSERT INTO menu_category (name) VALUES ('ทดสอบ') RETURNING id`);
    const monthAgo = new Date(NOW.getTime() - 30 * DAY_MS);
    const ids: Record<string, string> = {};
    const items: Array<[string, string, string, string | null, boolean, Date]> = [
      ['beer', 'เบียร์', 'simple', 'bar', true, monthAgo],
      ['wings', 'ปีกไก่', 'simple', 'food', true, monthAgo],
      ['unsold', 'ขายไม่ออก', 'simple', 'bar', true, monthAgo],
      ['unavailable', 'เลิกขาย', 'simple', 'food', false, monthAgo],
      ['fresh', 'เมนูใหม่', 'simple', 'food', true, new Date(NOW.getTime() - 3 * DAY_MS)],
      ['charge', 'ค่าเปิดขวด', 'charge', null, true, monthAgo],
    ];
    for (const [key, name, type, station, available, createdAt] of items) {
      const [item] = await dataSource.query(
        `INSERT INTO menu_item (category_id, name, item_type, kitchen_tag, is_available, created_at)
         VALUES ($1, $2, $3::item_type, $4::kitchen_station, $5, $6) RETURNING id`,
        [category.id, name, type, station, available, createdAt],
      );
      const [variant] = await dataSource.query(
        `INSERT INTO menu_item_variant (menu_item_id, name, price) VALUES ($1, 'ปกติ', 0) RETURNING id`,
        [item.id],
      );
      ids[key] = item.id;
      ids[`${key}Variant`] = variant.id;
    }
    return ids;
  }

  /** 12–14 Oct = the period; 10 Oct = the previous period. */
  async function insertHistory(): Promise<void> {
    const v0 = await visit(seats[0], 'closed', bkk('2026-10-10 20:00'), bkk('2026-10-10 21:00'));
    await payment(v0, { amount: '200.00', method: 'cash', via: 'cash', paidAt: bkk('2026-10-10 20:55') });

    const v1 = await visit(seats[0], 'closed', bkk('2026-10-12 20:00'), bkk('2026-10-12 22:00'));
    const o1 = await order(v1, '2026-10-12');
    const barTicket = await ticket(o1, 'bar', 'sent');
    await line(barTicket, 'beer', { quantity: 2, price: '120.00' });
    await line(barTicket, 'beer', { quantity: 1, price: '120.00', cancelled: true });
    await line(await ticket(o1, null, 'sent'), 'charge', { quantity: 1, price: '50.00' });
    await payment(v1, { amount: '500.00', method: 'promptpay', via: 'manual', paidAt: bkk('2026-10-12 21:50') });

    // Paid and closed after midnight → still business date 13 Oct.
    const v2 = await visit(seats[1], 'closed', bkk('2026-10-13 21:00'), bkk('2026-10-14 01:40'));
    const o2 = await order(v2, '2026-10-13');
    await line(await ticket(o2, 'food', 'sent'), 'wings', { quantity: 1, price: '180.00' });
    await line(await ticket(o2, 'bar', 'sent'), 'beer', { quantity: 1, price: '120.00' });
    await payment(v2, { amount: '300.00', method: 'cash', via: 'cash', paidAt: bkk('2026-10-14 01:30') });

    // ฿0 bill: closed with only a cancelled payment.
    const v3 = await visit(seats[2], 'closed', bkk('2026-10-13 22:00'), bkk('2026-10-13 23:00'));
    await payment(v3, { amount: '999.00', method: 'promptpay', via: null, paidAt: null, status: 'cancelled' });

    const v4 = await visit(seats[3], 'closed', bkk('2026-10-14 18:00'), bkk('2026-10-14 20:00'));
    const o4 = await order(v4, '2026-10-14');
    const food = await ticket(o4, 'food', 'sent');
    await line(food, 'wings', { quantity: 3, price: '180.00' });
    await line(food, 'unavailable', { quantity: 1, price: '90.00' });
    await line(food, 'fresh', { quantity: 1, price: '150.00' });
    await payment(v4, { amount: '700.00', method: 'promptpay', via: 'slip_verify', paidAt: bkk('2026-10-14 19:55') });
  }

  /** Tonight (15 Oct): two closed bills, two open seats with live tickets. */
  async function insertTonight(): Promise<void> {
    const early = await visit(seats[4], 'closed', bkk('2026-10-15 06:10'), bkk('2026-10-15 06:40'));
    await payment(early, { amount: '1000.00', method: 'promptpay', via: 'slip_verify', paidAt: bkk('2026-10-15 06:30') });
    const late = await visit(seats[5], 'closed', bkk('2026-10-15 20:00'), bkk('2026-10-15 21:15'));
    await payment(late, { amount: '250.00', method: 'cash', via: 'cash', paidAt: bkk('2026-10-15 21:10') });

    const c1 = await visit(seats[0], 'active', bkk('2026-10-15 19:00'), null);
    const first = await order(c1, '2026-10-15');
    const pendingTicket = await ticket(first, 'bar', 'pending');
    const beer = await line(pendingTicket, 'beer', { quantity: 2, price: '120.00' });
    await dataSource.query(
      `INSERT INTO order_item_modifier (order_item_id, modifier_option_id, price_delta_snapshot)
       VALUES ($1, $2, 10.00)`,
      [beer, await modifierOption()],
    );
    const second = await order(c1, '2026-10-15');
    const escalated = await ticket(second, 'food', 'issue');
    await dataSource.query(`UPDATE order_ticket SET issue_reason = 'other', issue_escalated_at = $2 WHERE id = $1`, [
      escalated,
      bkk('2026-10-15 21:30'),
    ]);
    await line(escalated, 'wings', { quantity: 1, price: '180.00' });

    const c2 = await visit(seats[1], 'open', bkk('2026-10-15 20:30'), null);
    const third = await order(c2, '2026-10-15');
    await line(await ticket(third, 'food', 'accepted'), 'wings', { quantity: 1, price: '180.00' });
    await line(await ticket(third, 'bar', 'issue'), 'beer', { quantity: 1, price: '120.00' });
  }

  async function visit(seatId: string | undefined, state: string, openedAt: Date, closedAt: Date | null): Promise<string> {
    const [row] = await dataSource.query(
      `INSERT INTO visit (table_seat_id, state, opened_at, closed_at) VALUES ($1, $2::visit_state, $3, $4) RETURNING id`,
      [seatId, state, openedAt, closedAt],
    );
    return row.id;
  }

  async function order(visitId: string, businessDate: string): Promise<string> {
    orderNumber += 1;
    const [row] = await dataSource.query(
      `INSERT INTO order_record (visit_id, order_number, business_date) VALUES ($1, $2, $3) RETURNING id`,
      [visitId, orderNumber, businessDate],
    );
    return row.id;
  }

  async function ticket(orderId: string, station: string | null, status: string): Promise<string> {
    const [row] = await dataSource.query(
      `INSERT INTO order_ticket (order_id, station, status) VALUES ($1, $2::kitchen_station, $3::order_status) RETURNING id`,
      [orderId, station, status],
    );
    return row.id;
  }

  async function line(
    ticketId: string,
    item: string,
    values: { quantity: number; price: string; cancelled?: boolean },
  ): Promise<string> {
    const [row] = await dataSource.query(
      `INSERT INTO order_item (ticket_id, menu_item_variant_id, quantity, unit_price_snapshot, cancelled_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ticketId, menu[`${item}Variant`], values.quantity, values.price, values.cancelled ? NOW : null],
    );
    return row.id;
  }

  async function payment(
    visitId: string,
    values: { amount: string; method: string; via: string | null; paidAt: Date | null; status?: string },
  ): Promise<void> {
    await dataSource.query(
      `INSERT INTO payment (visit_id, amount, method, status, confirmed_via, paid_at, attempt_id)
       VALUES ($1, $2, $3::payment_method, $4::payment_status, $5::payment_confirmed_via, $6, uuid_generate_v4())`,
      [visitId, values.amount, values.method, values.status ?? 'completed', values.via, values.paidAt],
    );
  }

  async function modifierOption(): Promise<string> {
    const [group] = await dataSource.query(`INSERT INTO modifier_group (name) VALUES ('เพิ่ม') RETURNING id`);
    const [option] = await dataSource.query(
      `INSERT INTO modifier_option (group_id, name, price_delta) VALUES ($1, 'มะนาว', 10.00) RETURNING id`,
      [group.id],
    );
    return option.id;
  }

  async function get(path: string) {
    const response = await request(app.getHttpServer()).get(path).set(auth()).expect(200);
    return response.body.data;
  }

  function auth(): Record<string, string> {
    return { Authorization: `Bearer ${accessToken}` };
  }
});
