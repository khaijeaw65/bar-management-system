import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { clearStaffAndVenue } from './staff-session.js';

interface ItemRow {
  id: string;
  name: string;
  item_type: string;
  kitchen_tag: string | null;
  variants: string;
}

describe('seed:menu (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
  });

  it('creates one venue and the menu, and a second run does not duplicate them', async () => {
    await seedVenue(dataSource);
    await seedMenu(dataSource);
    const first = await snapshot();

    await seedVenue(dataSource);
    await seedMenu(dataSource);
    expect(await snapshot()).toEqual(first);

    expect(first.venue).toEqual([
      { slug: 'main', kitchen_display_enabled: false, cutoff: '06:00:00' },
    ]);
    expect(first.categories).toEqual([
      'โปรโมชั่น',
      'เบียร์สด',
      'ค็อกเทล',
      'ไฮบอล',
      'อาหาร',
      'ค่าบริการ',
    ]);
    expect(first.items.map((item) => item.name)).toEqual([
      'ลีโอ 4 ขวด + ถังน้ำแข็ง',
      'ค็อกเทล 1 แถม 1',
      'ช้างดราฟต์',
      'สิงห์ดราฟต์',
      'ลีโอขวด',
      'เนโกรนี',
      'โอลด์แฟชั่น',
      'ไฮบอลมะนาวโซดา',
      'ยำหมูยอ',
      'ถั่วทอดสมุนไพร',
      'ค่าเปิดขวด',
    ]);
    expect(first.items.every((item) => Number(item.variants) >= 1)).toBe(true);
    const oldFashioned = first.items.find((item) => item.name === 'โอลด์แฟชั่น');
    expect(oldFashioned?.variants).toBe('2');
    const charge = first.items.find((item) => item.name === 'ค่าเปิดขวด');
    expect(charge).toMatchObject({ item_type: 'charge', kitchen_tag: null });
    expect(
      first.items
        .filter((item) => item.item_type !== 'charge')
        .every((item) => item.kitchen_tag !== null),
    ).toBe(true);
  });

  async function snapshot(): Promise<{
    venue: Array<{ slug: string; kitchen_display_enabled: boolean; cutoff: string }>;
    categories: string[];
    items: ItemRow[];
    ids: string[];
  }> {
    const venue = await dataSource.query(
      `SELECT slug, kitchen_display_enabled, business_day_cutoff::text AS cutoff
       FROM venue ORDER BY slug`,
    );
    const categories: Array<{ name: string }> = await dataSource.query(
      `SELECT name FROM menu_category ORDER BY sort_order, name`,
    );
    const items: ItemRow[] = await dataSource.query(
      `SELECT i.id, i.name, i.item_type, i.kitchen_tag,
              (SELECT count(*)::text FROM menu_item_variant v WHERE v.menu_item_id = i.id) AS variants
       FROM menu_item i
       JOIN menu_category c ON c.id = i.category_id
       ORDER BY c.sort_order, i.sort_order, i.name`,
    );
    const ids = await idList();
    return {
      venue,
      categories: categories.map((category) => category.name),
      items,
      ids,
    };
  }

  async function idList(): Promise<string[]> {
    const tables = [
      'venue',
      'menu_category',
      'menu_item',
      'menu_item_variant',
      'menu_item_availability',
      'modifier_group',
      'modifier_option',
    ];
    const ids: string[] = [];
    for (const table of tables) {
      const rows: Array<{ id: string }> = await dataSource.query(
        `SELECT id FROM ${table} ORDER BY id`,
      );
      ids.push(...rows.map((row) => row.id));
    }
    return ids;
  }
});
