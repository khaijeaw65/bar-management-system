import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import {
  DEMO_HISTORY_TAG,
  assertDemoSeedAllowed,
  countDemoHistory,
  seedDemoHistory,
} from '../src/cli/demo-history.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff } from './staff-session.js';

// 02:00 Bangkok on 23 Oct → business date 22 Oct (cut-off 06:00) → history 22 Sep – 21 Oct.
const NOW = new Date('2026-10-23T02:00:00+07:00');

describe('seed:demo-history (e2e, AC-6)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let staffId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await app.get(RedisService).client.flushdb();
    await clearStaffAndVenue(dataSource);
    staffId = await insertStaff(dataSource, 'เจ้าของ');
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  it('writes 30 business days ending yesterday, Fri / Sat busier, audited as the seeded staff', async () => {
    const result = await seedDemoHistory(dataSource, NOW);
    expect(result.days).toBe(30);
    expect(result.visits).toBeGreaterThan(400);

    const [range] = await dataSource.query(
      `SELECT min(business_date)::text AS first, max(business_date)::text AS last FROM order_record`,
    );
    expect(range).toEqual({ first: '2026-09-22', last: '2026-10-21' });
    expect(await busiestWeekdays()).toEqual(expect.arrayContaining([5, 6]));
    expect(await unaudited()).toBe(0);
    const methods = await dataSource.query(
      `SELECT confirmed_via, count(*)::int AS count FROM payment GROUP BY 1 ORDER BY 1::text`,
    );
    expect(methods.map((row: { confirmed_via: string }) => row.confirmed_via)).toEqual(['cash', 'manual', 'slip_verify']);
    const [cancelled] = await dataSource.query(`SELECT count(*)::int AS count FROM order_item WHERE cancelled_at IS NOT NULL`);
    expect(cancelled.count).toBeGreaterThanOrEqual(30);
  });

  it('a re-run replaces only its own rows, with the same counts', async () => {
    const first = await countDemoHistory(dataSource);
    const [real] = await dataSource.query(
      `INSERT INTO visit (table_seat_id, state, opened_at, closed_at)
       SELECT id, 'closed', now() - interval '2 hours', now() - interval '1 hour' FROM table_seat LIMIT 1
       RETURNING id`,
    );

    const second = await seedDemoHistory(dataSource, NOW);
    expect(second).toEqual(first);
    const [kept] = await dataSource.query(`SELECT count(*)::int AS count FROM visit WHERE id = $1`, [real.id]);
    expect(kept.count).toBe(1);
    const [tagged] = await dataSource.query(`SELECT count(*)::int AS count FROM visit WHERE guest_label = $1`, [
      DEMO_HISTORY_TAG,
    ]);
    expect(tagged.count).toBe(first.visits);
  });

  it('refuses NODE_ENV=production', () => {
    expect(() => assertDemoSeedAllowed('production')).toThrow(/refuses to run with NODE_ENV=production/);
    expect(() => assertDemoSeedAllowed('local')).not.toThrow();
  });

  async function busiestWeekdays(): Promise<number[]> {
    const rows = await dataSource.query(
      `SELECT EXTRACT(DOW FROM business_date)::int AS weekday, count(DISTINCT visit_id)::float / count(DISTINCT business_date) AS per_day
       FROM order_record GROUP BY 1 ORDER BY 2 DESC LIMIT 2`,
    );
    return rows.map((row: { weekday: number }) => row.weekday);
  }

  async function unaudited(): Promise<number> {
    const [row] = await dataSource.query(
      `SELECT (SELECT count(*) FROM order_record WHERE created_by IS DISTINCT FROM $1)
            + (SELECT count(*) FROM order_item WHERE created_by IS DISTINCT FROM $1)
            + (SELECT count(*) FROM payment WHERE created_by IS DISTINCT FROM $1) AS count`,
      [staffId],
    );
    return Number(row.count);
  }
});
