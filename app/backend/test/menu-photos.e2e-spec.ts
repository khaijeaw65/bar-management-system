import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { MenuCategory, MenuItem } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { StorageService } from '../src/common/storage/storage.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { FakeStorage } from './fake-storage.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const MB = 1024 * 1024;

describe('Menu photos and hidden-category reads (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  const storage = new FakeStorage();

  beforeAll(async () => {
    // AC-6: no AWS keys here, and StorageService is replaced, so nothing can reach S3.
    expect(process.env.AWS_ACCESS_KEY_ID).toBeFalsy();
    expect(process.env.AWS_SECRET_ACCESS_KEY).toBeFalsy();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(StorageService)
      .useValue(storage)
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
    storage.objects.clear();
    storage.failCopy = false;
    storage.failRemove = false;
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    accessToken = (await staffSession(app, await insertStaff(dataSource, 'เอ'))).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  describe('POST /menu/items/image-upload-url', () => {
    it.each([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
    ])('presigns %s into tmp/', async (contentType, ext) => {
      const response = await post('/api/menu/items/image-upload-url').send({ contentType }).expect(200);
      const data = response.body.data as { url: string; fields: Record<string, string>; key: string; expiresAt: string };
      expect(data.key).toMatch(new RegExp(`^tmp/[0-9a-f-]{36}\\.${ext}$`));
      expect(data.fields['Content-Type']).toBe(contentType);
      expect(Date.parse(data.expiresAt)).toBeGreaterThan(Date.now() + 4 * 60 * 1000);
      expect(Date.parse(data.expiresAt)).toBeLessThan(Date.now() + 6 * 60 * 1000);
    });

    it('rejects another type or a missing one with 400', async () => {
      for (const body of [{ contentType: 'image/gif' }, { contentType: 'text/plain' }, {}]) {
        const response = await post('/api/menu/items/image-upload-url').send(body);
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('create with a photo', () => {
    it('copies the upload to menu/<itemId>/, serves a presigned URL and deletes the tmp object', async () => {
      const tmp = await upload();
      const item = await create({ imageKey: tmp });
      const stored = (await one(`SELECT image_key FROM menu_item WHERE id = $1`, [item.id])).image_key as string;
      expect(stored).toMatch(new RegExp(`^menu/${item.id}/[0-9a-f-]{36}\\.jpg$`));
      expect(item.imageUrl).toContain(stored);
      expect(storage.keys('')).toEqual([stored]);
      expect((await get(`/api/menu/items/${item.id}`).expect(200)).body.data.imageUrl).toContain(stored);
      const listed = (await get('/api/menu/items').expect(200)).body.data.items as MenuItem[];
      expect(listed.find((entry) => entry.id === item.id)?.imageUrl).toContain(stored);
    });

    it('has no photo when imageKey is omitted or null', async () => {
      expect((await create({})).imageUrl).toBeNull();
      expect((await create({ imageKey: null })).imageUrl).toBeNull();
    });

    it('rejects a missing, oversized, wrong-type or foreign key with 400 and creates no item', async () => {
      const cases = [
        'tmp/5b0c3f1e-8d2a-4c47-9a51-0e6f2b7d3c18.jpg',
        await upload(5 * MB + 1),
        await upload(MB, 'text/plain'),
        'menu/other/photo.jpg',
      ];
      for (const imageKey of cases) {
        const response = await post('/api/menu/items').send({ ...(await body()), imageKey });
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
      expect(await count(`SELECT COUNT(*) AS n FROM menu_item WHERE name = 'จินโทนิค'`)).toBe(0);
      expect(storage.keys('menu/')).toEqual([]);
    });

    it('removes the copied object when the DB write is refused', async () => {
      const tmp = await upload();
      const response = await post('/api/menu/items').send({ ...(await body()), modifierGroupIds: [UNKNOWN], imageKey: tmp });
      expect(response.status).toBe(400);
      expect(storage.keys('menu/')).toEqual([]);
      expect(await count(`SELECT COUNT(*) AS n FROM menu_item WHERE name = 'จินโทนิค'`)).toBe(0);
    });
  });

  describe('PATCH imageKey', () => {
    it('omitted keeps the photo, and the current key keeps it too', async () => {
      const item = await create({ imageKey: await upload() });
      const key = await storedKey(item.id);
      const kept = await patch(item.id, edit(item, {})).expect(200);
      expect(kept.body.data.imageUrl).toContain(key);
      const again = await patch(item.id, edit(kept.body.data, { imageKey: key })).expect(200);
      expect(again.body.data.imageUrl).toContain(key);
      expect(storage.keys('')).toEqual([key]);
    });

    it('null removes the photo and deletes the object', async () => {
      const item = await create({ imageKey: await upload() });
      const removed = await patch(item.id, edit(item, { imageKey: null })).expect(200);
      expect(removed.body.data.imageUrl).toBeNull();
      expect(await storedKey(item.id)).toBeNull();
      expect(storage.keys('')).toEqual([]);
    });

    it('a new tmp/ key replaces the photo and deletes the old object', async () => {
      const item = await create({ imageKey: await upload() });
      const before = await storedKey(item.id);
      const replaced = await patch(item.id, edit(item, { imageKey: await upload(MB, 'image/png') })).expect(200);
      const after = await storedKey(item.id);
      expect(after).toMatch(new RegExp(`^menu/${item.id}/[0-9a-f-]{36}\\.png$`));
      expect(after).not.toBe(before);
      expect(replaced.body.data.imageUrl).toContain(after);
      expect(storage.keys('')).toEqual([after]);
    });

    it('attaches a first photo to an item that had none', async () => {
      const item = await create({});
      await patch(item.id, edit(item, { imageKey: await upload() })).expect(200);
      expect(storage.keys('')).toEqual([await storedKey(item.id)]);
    });

    it('any other key is 400 and leaves the photo alone', async () => {
      const item = await create({ imageKey: await upload() });
      const key = await storedKey(item.id);
      for (const imageKey of [`menu/${UNKNOWN}/x.jpg`, 'menu/', 'x']) {
        const response = await patch(item.id, edit(item, { imageKey }));
        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
      expect(storage.keys('')).toEqual([key]);
    });

    it('a stale save drops the copy, keeps the old photo and shows the photo in details', async () => {
      const item = await create({ imageKey: await upload() });
      const key = await storedKey(item.id);
      await patch(item.id, edit(item, { name: 'ใหม่' })).expect(200);
      const stale = await patch(item.id, edit(item, { imageKey: await upload() }));
      expect(stale.status).toBe(409);
      expect(stale.body.code).toBe('MENU_ITEM_STALE');
      expect(stale.body.data.details.imageUrl).toContain(key);
      expect(storage.keys('menu/')).toEqual([key]);
    });

    it('still succeeds when the cleanup deletes fail', async () => {
      const item = await create({ imageKey: await upload() });
      storage.failRemove = true;
      await patch(item.id, edit(item, { imageKey: null })).expect(200);
      expect(await storedKey(item.id)).toBeNull();
    });
  });

  describe('includeHidden', () => {
    it('lists hidden categories and their items only when asked', async () => {
      const item = await create({});
      const hidden = item.categoryId;
      await request(app.getHttpServer())
        .patch(`/api/menu/categories/${hidden}`)
        .set(auth())
        .send({ isActive: false })
        .expect(200);

      const visible = await categories('');
      expect(visible.every((category) => category.isActive)).toBe(true);
      expect(visible.map((category) => category.id)).not.toContain(hidden);
      expect(await categories('?includeHidden=false')).toEqual(visible);

      const all = await categories('?includeHidden=true');
      expect(all.find((category) => category.id === hidden)).toMatchObject({ isActive: false });
      expect(all.filter((category) => category.id !== hidden)).toEqual(visible);

      const defaults = (await get('/api/menu/items').expect(200)).body.data.items as MenuItem[];
      expect(defaults.some((entry) => entry.id === item.id)).toBe(false);
      const withHidden = (await get('/api/menu/items?includeHidden=true').expect(200)).body.data.items as MenuItem[];
      expect(withHidden.find((entry) => entry.id === item.id)).toMatchObject({ availableNow: false, unavailableReason: 'sold_out' });
      expect(withHidden.length).toBeGreaterThan(defaults.length);
      const only = (await get(`/api/menu/items?includeHidden=true&categoryId=${hidden}`).expect(200)).body.data.items as MenuItem[];
      expect(only.every((entry) => entry.categoryId === hidden)).toBe(true);
      const available = (await get('/api/menu/items?includeHidden=true&available=true').expect(200)).body.data.items as MenuItem[];
      expect(available.some((entry) => entry.categoryId === hidden)).toBe(false);
    });

    it('rejects a value other than true / false', async () => {
      expect((await get('/api/menu/categories?includeHidden=yes')).status).toBe(400);
      expect((await get('/api/menu/items?includeHidden=1')).status).toBe(400);
    });

    it('puts isActive on every category response', async () => {
      const created = await post('/api/menu/categories').send({ name: 'ไวน์' }).expect(201);
      expect(created.body.data).toMatchObject({ isActive: true });
      const list = await categories('');
      const ids = list.map((category) => category.id);
      const reordered = await request(app.getHttpServer())
        .put('/api/menu/categories/order')
        .set(auth())
        .send({ ids: [...ids].reverse() })
        .expect(200);
      expect((reordered.body.data.items as MenuCategory[]).every((category) => typeof category.isActive === 'boolean')).toBe(true);
      const renamed = await request(app.getHttpServer())
        .patch(`/api/menu/categories/${created.body.data.id}`)
        .set(auth())
        .send({ name: 'ไวน์แดง' })
        .expect(200);
      expect(renamed.body.data).toMatchObject({ name: 'ไวน์แดง', isActive: true });
    });
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function get(path: string) {
    return request(app.getHttpServer()).get(path).set(auth());
  }

  function post(path: string) {
    return request(app.getHttpServer()).post(path).set(auth());
  }

  function patch(id: string, payload: unknown) {
    return request(app.getHttpServer()).patch(`/api/menu/items/${id}`).set(auth()).send(payload as object);
  }

  /** What the browser's POST to the presigned URL leaves behind: an object under the issued tmp key. */
  async function upload(size = MB, contentType = 'image/jpeg'): Promise<string> {
    const issued = await post('/api/menu/items/image-upload-url')
      .send({ contentType: contentType === 'text/plain' ? 'image/jpeg' : contentType })
      .expect(200);
    const key = issued.body.data.key as string;
    storage.upload(key, size, contentType);
    return key;
  }

  async function body(): Promise<Record<string, unknown>> {
    return {
      categoryId: await categoryId('ค็อกเทล'),
      name: 'จินโทนิค',
      itemType: 'simple',
      station: 'bar',
      isPromo: false,
      variants: [{ name: 'แก้ว', price: '180.00' }],
    };
  }

  async function create(extra: Record<string, unknown>): Promise<MenuItem> {
    return (await post('/api/menu/items').send({ ...(await body()), ...extra }).expect(201)).body.data as MenuItem;
  }

  async function categories(query: string): Promise<MenuCategory[]> {
    return (await get(`/api/menu/categories${query}`).expect(200)).body.data.items as MenuCategory[];
  }

  async function categoryId(name: string): Promise<string> {
    return (await one(`SELECT id FROM menu_category WHERE name = $1`, [name])).id as string;
  }

  async function storedKey(id: string): Promise<string | null> {
    return (await one(`SELECT image_key FROM menu_item WHERE id = $1`, [id])).image_key as string | null;
  }

  async function one(sql: string, parameters: unknown[] = []): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await dataSource.query(sql, parameters);
    if (!rows[0]) throw new Error(`no row: ${sql}`);
    return rows[0];
  }

  async function count(sql: string): Promise<number> {
    return Number((await one(sql)).n);
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
