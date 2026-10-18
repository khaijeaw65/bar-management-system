import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  MenuCategoryListSchema,
  MenuItemListSchema,
  MenuItemSchema,
  VenueSettingsSchema,
  type MenuItem,
} from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { CLOCK } from '../src/common/clock.js';
import { MenuCatalogService } from '../src/modules/menu/application/menu-catalog.service.js';
import { MenuItemVariant } from '../src/modules/menu/infrastructure/persistence/menu-item-variant.entity.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';
const FRIDAY_2300 = new Date('2026-10-16T16:00:00.000Z');

describe('Menu and venue read (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => FRIDAY_2300 })
      .compile();
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
    const staffId = await insertStaff(dataSource, 'Owner');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('lists categories and the full menu in sort order', async () => {
    const categories = MenuCategoryListSchema.parse(await get('/api/menu/categories'));
    expect(categories.items.map((category) => category.name)).toEqual([
      'โปรโมชั่น',
      'เบียร์สด',
      'ค็อกเทล',
      'ไฮบอล',
      'อาหาร',
      'ค่าบริการ',
    ]);

    const menu = MenuItemListSchema.parse(await get('/api/menu/items'));
    expect(menu.items.map((item) => item.name)).toEqual([
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
    const oldFashioned = itemNamed(menu.items, 'โอลด์แฟชั่น');
    expect(oldFashioned.basePrice).toBe('260.00');
    expect(oldFashioned.variants.map((variant) => variant.name)).toEqual([
      'ปกติ',
      'ดับเบิล',
    ]);
    expect(oldFashioned.variants[0]?.modifierGroups.map((group) => group.name)).toEqual([
      'น้ำแข็ง',
      'เพิ่ม',
    ]);
    expect(oldFashioned.imageUrl).toBeNull();
    expect(itemNamed(menu.items, 'ค่าเปิดขวด').station).toBeNull();
    expect(itemNamed(menu.items, 'ยำหมูยอ')).toMatchObject({
      station: 'food',
      availableNow: false,
      unavailableReason: 'sold_out',
    });
    expect(itemNamed(menu.items, 'ลีโอ 4 ขวด + ถังน้ำแข็ง')).toMatchObject({
      availableNow: false,
      unavailableReason: 'out_of_window',
      isPromo: true,
    });
    expect(itemNamed(menu.items, 'ค็อกเทล 1 แถม 1').availableNow).toBe(true);

    const beer = categories.items.find((category) => category.name === 'เบียร์สด');
    const filtered = MenuItemListSchema.parse(
      await get(`/api/menu/items?categoryId=${beer?.id}`),
    );
    expect(filtered.items.map((item) => item.name)).toEqual([
      'ช้างดราฟต์',
      'สิงห์ดราฟต์',
      'ลีโอขวด',
    ]);

    const available = MenuItemListSchema.parse(
      await get('/api/menu/items?available=true'),
    );
    const names = available.items.map((item) => item.name);
    expect(names).not.toContain('ยำหมูยอ');
    expect(names).not.toContain('ลีโอ 4 ขวด + ถังน้ำแข็ง');
    expect(names).toContain('ค็อกเทล 1 แถม 1');
    expect(names).toContain('ช้างดราฟต์');

    const detail = MenuItemSchema.parse(
      await get(`/api/menu/items/${oldFashioned.id}`),
    );
    expect(detail).toEqual(oldFashioned);
  });

  it('reads venue settings without payment fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/venue')
      .set(auth())
      .expect(200);
    expect(VenueSettingsSchema.parse(response.body.data)).toEqual({
      name: 'The Loft Bar',
      slug: 'main',
      kitchenDisplayEnabled: false,
      businessDayCutoff: '06:00',
      counterQrEnabled: false,
    });
    expect(JSON.stringify(response.body)).not.toMatch(/promptpay|payment/i);
  });

  it('returns 404 for an unknown item and 400 for a bad query', async () => {
    const missing = await request(app.getHttpServer())
      .get(`/api/menu/items/${UNKNOWN_ID}`)
      .set(auth())
      .expect(404);
    expect(missing.body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'ไม่พบเมนู',
      data: null,
    });

    const invalid = await request(app.getHttpServer())
      .get('/api/menu/items?categoryId=not-a-uuid')
      .set(auth())
      .expect(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');

    const badFlag = await request(app.getHttpServer())
      .get('/api/menu/items?available=false')
      .set(auth())
      .expect(400);
    expect(badFlag.body.code).toBe('VALIDATION_ERROR');
  });

  it('treats a turned-off variant as sold out in getOrderable', async () => {
    const menu = MenuItemListSchema.parse(await get('/api/menu/items'));
    const chang = itemNamed(menu.items, 'ช้างดราฟต์').variants[0];
    if (!chang) throw new Error('seed variants missing');

    const variants = dataSource.getRepository(MenuItemVariant);
    const row = await variants.findOneByOrFail({ id: chang.id });
    row.isAvailable = false;
    await variants.save(row);

    const lookup = await app.get(MenuCatalogService).getOrderable(
      [chang.id],
      FRIDAY_2300,
    );
    expect(lookup.missing).toEqual([]);
    expect(lookup.found).toEqual([
      expect.objectContaining({
        variantId: chang.id,
        price: '120.00',
        availableNow: false,
        unavailableReason: 'sold_out',
      }),
    ]);
  });

  it('reports a missing variant from getOrderable without throwing', async () => {
    const menu = MenuItemListSchema.parse(await get('/api/menu/items'));
    const chang = itemNamed(menu.items, 'ช้างดราฟต์').variants[0];
    const yam = itemNamed(menu.items, 'ยำหมูยอ').variants[0];
    if (!chang || !yam) throw new Error('seed variants missing');

    const lookup = await app.get(MenuCatalogService).getOrderable(
      [chang.id, UNKNOWN_ID, yam.id],
      FRIDAY_2300,
    );
    expect(lookup.missing).toEqual([UNKNOWN_ID]);
    expect(lookup.found).toEqual([
      expect.objectContaining({
        variantId: chang.id,
        price: '120.00',
        itemName: 'ช้างดราฟต์',
        kitchenTag: 'bar',
        itemType: 'simple',
        availableNow: true,
        unavailableReason: null,
      }),
      expect.objectContaining({
        variantId: yam.id,
        availableNow: false,
        unavailableReason: 'sold_out',
        kitchenTag: 'food',
      }),
    ]);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async function get(path: string): Promise<unknown> {
    const response = await request(app.getHttpServer())
      .get(path)
      .set(auth())
      .expect(200);
    return response.body.data;
  }
});

function itemNamed(items: MenuItem[], name: string): MenuItem {
  const item = items.find((candidate) => candidate.name === name);
  if (!item) throw new Error(`${name} missing`);
  return item;
}
