import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { MenuCategory, MenuItem, Order, OrderLine } from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { PERMISSIONS_KEY } from '../src/common/guards/permissions.guard.js';
import { MenuItemWriteController } from '../src/modules/menu/infrastructure/http/menu-item-write.controller.js';
import { MenuController } from '../src/modules/menu/infrastructure/http/menu.controller.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const KEY = '5b0c3f1e-8d2a-4c47-9a51-0e6f2b7d3c18';

describe('Menu write API (e2e)', () => {
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

  it('creates a bar item with two variants, replays the same key, and emits one menu.changed', async () => {
    const socket = await connect();
    const changed: unknown[] = [];
    socket.on('menu.changed', (payload) => changed.push(payload));
    const ice = await groupId('น้ำแข็ง');
    const body = { ...gin(await categoryId('ค็อกเทล')), modifierGroupIds: [ice] };

    const created = await post('/api/menu/items').set('Idempotency-Key', KEY).send(body).expect(201);
    const item = created.body.data as MenuItem;
    expect(item).toMatchObject({
      name: 'จินโทนิค',
      itemType: 'simple',
      station: 'bar',
      isPromo: false,
      basePrice: '180.00',
      availableNow: true,
      updatedAt: expect.any(String),
    });
    expect(item.variants.map((variant) => [variant.name, variant.price, variant.modifierGroups.map((g) => g.id)])).toEqual([
      ['แก้ว', '180.00', [ice]],
      ['ดับเบิล', '260.00', [ice]],
    ]);

    const replay = await post('/api/menu/items').set('Idempotency-Key', KEY).send(body).expect(201);
    expect(replay.body.data).toEqual(item);
    expect(await count(`SELECT COUNT(*) AS n FROM menu_item WHERE name = 'จินโทนิค'`)).toBe(1);

    const listed = await get('/api/menu/items').expect(200);
    expect((listed.body.data.items as MenuItem[]).some((entry) => entry.id === item.id)).toBe(true);
    await waitFor(changed, 1);
    await pause(100);
    expect(changed).toEqual([{ itemIds: [item.id] }]);
  });

  it('rejects the DR-012 station rule, recipe, empty variants and unknown references', async () => {
    const base = gin(await categoryId('ค็อกเทล'));
    const cases = [
      { ...base, itemType: 'charge' },
      { ...base, station: null },
      { ...base, itemType: 'recipe' },
      { ...base, variants: [] },
      { ...base, modifierGroupIds: [UNKNOWN] },
    ];
    for (const body of cases) {
      const response = await post('/api/menu/items').send(body);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }
    expect(await post('/api/menu/items').send({ ...base, categoryId: UNKNOWN })).toMatchObject({
      status: 404,
      body: { code: 'NOT_FOUND' },
    });
    const charge = { ...base, itemType: 'charge', station: null, variants: [{ name: 'ต่อคน', price: '0.00' }] };
    expect((await post('/api/menu/items').send(charge).expect(201)).body.data.station).toBeNull();
    expect(await count(`SELECT COUNT(*) AS n FROM menu_item WHERE name = 'จินโทนิค'`)).toBe(1);
  });

  it('answers a stale updatedAt with 409 MENU_ITEM_STALE and the current item', async () => {
    const item = await create();
    const fresh = await patch(item.id, edit(item, { name: 'จินโทนิค (ใหม่)' })).expect(200);
    const saved = fresh.body.data as MenuItem;
    expect(saved.name).toBe('จินโทนิค (ใหม่)');
    expect(Date.parse(saved.updatedAt)).toBeGreaterThan(Date.parse(item.updatedAt));

    const stale = await patch(item.id, edit(item, { name: 'ทับของคนอื่น' }));
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('MENU_ITEM_STALE');
    expect(stale.body.data.details).toEqual(saved);
    expect((await get(`/api/menu/items/${item.id}`).expect(200)).body.data.name).toBe('จินโทนิค (ใหม่)');

    // A variant-only edit also moves the stamp, so the next stale save still loses.
    const priced = await patch(item.id, edit(saved, { variants: saved.variants.map((v) => ({ id: v.id, name: v.name, price: '1.00' })) })).expect(200);
    expect(Date.parse(priced.body.data.updatedAt)).toBeGreaterThan(Date.parse(saved.updatedAt));
    expect((await patch(item.id, edit(saved, {}))).body.code).toBe('MENU_ITEM_STALE');
    expect((await patch(UNKNOWN, edit(saved, {}))).status).toBe(404);
  });

  it('deactivates a dropped variant and keeps ordered lines at their snapshot price', async () => {
    const item = await create();
    const [glass, double] = item.variants;
    if (!glass || !double) throw new Error('variants missing');
    const visitId = await open('T1');
    const first = await place(visitId, [glass.id, double.id]);
    const before = await bill(visitId);

    const updated = await patch(
      item.id,
      edit(item, { variants: [{ id: glass.id, name: 'แก้ว', price: '200.00' }, { name: 'เหยือก', price: '590.00' }] }),
    ).expect(200);
    const after = updated.body.data as MenuItem;
    expect(after.basePrice).toBe('200.00');
    expect(after.variants.map((v) => [v.name, v.price, v.isAvailable])).toEqual([
      ['แก้ว', '200.00', true],
      ['ดับเบิล', '260.00', false],
      ['เหยือก', '590.00', true],
    ]);
    expect(await count(`SELECT COUNT(*) AS n FROM menu_item_variant WHERE menu_item_id = '${item.id}'`)).toBe(3);

    expect(await bill(visitId)).toBe(before);
    const kept = await lines(first);
    expect(kept.map((line) => [line.variantName, line.unitPrice])).toEqual([
      ['แก้ว', '180.00'],
      ['ดับเบิล', '260.00'],
    ]);
    expect(kept.every((line) => line.name === 'จินโทนิค')).toBe(true);

    const refused = await post(`/api/visits/${visitId}/orders`).send({ items: [{ variantId: double.id, quantity: 1 }] });
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('ITEM_UNAVAILABLE');
    const second = await place(visitId, [glass.id]);
    expect((await lines(second)).map((line) => line.unitPrice)).toEqual(['200.00']);

    const foreign = (await create('ไวท์รัสเซียน')).variants[0]?.id;
    const wrong = await patch(item.id, edit(after, { variants: [{ id: foreign, name: 'แก้ว', price: '1.00' }] }));
    expect(wrong.status).toBe(400);
  });

  it('creates, renames, reorders, hides and deletes categories', async () => {
    const socket = await connect();
    const changed: unknown[] = [];
    socket.on('menu.changed', (payload) => changed.push(payload));
    const initial = await categories();

    const created = (await post('/api/menu/categories').send({ name: ' ไวน์ ' }).expect(201)).body.data as MenuCategory;
    expect(created.name).toBe('ไวน์');
    expect(created.sortOrder).toBeGreaterThan(Math.max(...initial.map((category) => category.sortOrder)));
    const renamed = await request(app.getHttpServer())
      .patch(`/api/menu/categories/${created.id}`)
      .set(auth())
      .send({ name: 'ไวน์แก้ว' })
      .expect(200);
    expect(renamed.body.data).toMatchObject({ id: created.id, name: 'ไวน์แก้ว' });

    const reversed = [created.id, ...initial.map((category) => category.id).reverse()];
    const ordered = await put(reversed).expect(200);
    expect((ordered.body.data.items as MenuCategory[]).map((category) => category.id)).toEqual(reversed);
    expect((await put(reversed.slice(1))).status).toBe(400);
    expect((await put([...reversed, UNKNOWN])).status).toBe(404);

    const cocktails = await categoryId('ค็อกเทล');
    await request(app.getHttpServer()).patch(`/api/menu/categories/${cocktails}`).set(auth()).send({ isActive: false }).expect(200);
    const items = (await get('/api/menu/items').expect(200)).body.data.items as MenuItem[];
    expect(items.some((item) => item.categoryId === cocktails)).toBe(false);
    expect((await categories()).some((category) => category.id === cocktails)).toBe(false);
    // The hidden category may be left out of a reorder.
    await put(reversed.filter((id) => id !== cocktails)).expect(200);

    const notEmpty = await remove(cocktails);
    expect(notEmpty.status).toBe(409);
    expect(notEmpty.body.code).toBe('CATEGORY_NOT_EMPTY');
    expect((await remove(created.id).expect(200)).body.data).toEqual({ ok: true });
    expect((await remove(created.id)).status).toBe(404);

    await waitFor(changed, 6);
    await pause(100);
    expect(changed).toEqual([
      { categoryIds: [created.id] },
      { categoryIds: [created.id] },
      { categoryIds: reversed },
      { categoryIds: [cocktails] },
      { categoryIds: reversed.filter((id) => id !== cocktails) },
      { categoryIds: [created.id] },
    ]);
  });

  it('declares menu:write on every write route', () => {
    const reflector = app.get(Reflector);
    const handlers = [
      MenuItemWriteController.prototype.create,
      MenuItemWriteController.prototype.update,
      MenuController.prototype.createCategory,
      MenuController.prototype.updateCategory,
      MenuController.prototype.reorderCategories,
      MenuController.prototype.deleteCategory,
    ];
    for (const handler of handlers) expect(reflector.get(PERMISSIONS_KEY, handler)).toEqual(['menu:write']);
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

  function patch(id: string, body: unknown) {
    return request(app.getHttpServer()).patch(`/api/menu/items/${id}`).set(auth()).send(body as object);
  }

  function put(ids: string[]) {
    return request(app.getHttpServer()).put('/api/menu/categories/order').set(auth()).send({ ids });
  }

  function remove(id: string) {
    return request(app.getHttpServer()).delete(`/api/menu/categories/${id}`).set(auth());
  }

  async function create(name = 'จินโทนิค'): Promise<MenuItem> {
    const body = { ...gin(await categoryId('ค็อกเทล')), name };
    return (await post('/api/menu/items').send(body).expect(201)).body.data as MenuItem;
  }

  async function categories(): Promise<MenuCategory[]> {
    return (await get('/api/menu/categories').expect(200)).body.data.items as MenuCategory[];
  }

  async function categoryId(name: string): Promise<string> {
    return (await one(`SELECT id FROM menu_category WHERE name = $1`, [name])).id as string;
  }

  async function groupId(name: string): Promise<string> {
    return (await one(`SELECT id FROM modifier_group WHERE name = $1`, [name])).id as string;
  }

  async function one(sql: string, parameters: unknown[] = []): Promise<Record<string, unknown>> {
    const rows: Record<string, unknown>[] = await dataSource.query(sql, parameters);
    if (!rows[0]) throw new Error(`no row: ${sql}`);
    return rows[0];
  }

  async function count(sql: string): Promise<number> {
    return Number((await one(sql)).n);
  }

  async function open(label: string): Promise<string> {
    const seat = await one(`SELECT id FROM table_seat WHERE label = $1`, [label]);
    const opened = await post('/api/visits').send({ tableSeatId: seat.id }).expect(201);
    return opened.body.data.visit.id as string;
  }

  async function place(visitId: string, variantIds: string[]): Promise<Order> {
    const items = variantIds.map((variantId) => ({ variantId, quantity: 1 }));
    return (await post(`/api/visits/${visitId}/orders`).send({ items }).expect(201)).body.data as Order;
  }

  async function lines(order: Order): Promise<OrderLine[]> {
    const reloaded = (await get(`/api/orders/${order.id}`).expect(200)).body.data as Order;
    return reloaded.tickets.flatMap((ticket) => ticket.items);
  }

  async function bill(visitId: string): Promise<string> {
    return (await get(`/api/visits/${visitId}`).expect(200)).body.data.bill.total as string;
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

function gin(categoryId: string) {
  return {
    categoryId,
    name: 'จินโทนิค',
    itemType: 'simple',
    station: 'bar',
    isPromo: false,
    variants: [
      { name: 'แก้ว', price: '180.00' },
      { name: 'ดับเบิล', price: '260.00' },
    ],
  };
}

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

async function waitFor(events: unknown[], count: number): Promise<void> {
  const started = Date.now();
  while (events.length < count && Date.now() - started < 2_000) {
    await pause(20);
  }
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
