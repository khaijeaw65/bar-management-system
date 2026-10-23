import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { MenuItem, ModifierGroupAdmin, Order, OrderLine } from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

const UNKNOWN = '99999999-9999-4999-8999-999999999999';
const GROUPS = '/api/menu/modifier-groups';

describe('Add-on groups API (e2e, BRIEF-044)', () => {
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

  it('AC-1: creates a required group, lists it unused, then counts the item that links it', async () => {
    const changed = await listen();
    const created = await post(ice()).expect(201);
    const group = created.body.data as ModifierGroupAdmin;
    expect(group).toMatchObject({ name: 'ระดับน้ำแข็ง', isRequired: true, minSelect: 1, maxSelect: 1, usedByItems: 0 });
    expect(group.options.map((option) => [option.name, option.priceDelta, option.isAvailable])).toEqual([
      ['ปกติ', '0.00', true],
      ['น้อย', '0.00', true],
      ['ไม่ใส่', '5.00', true],
    ]);

    expect(await find(group.id)).toMatchObject({ usedByItems: 0 });
    const item = await createItem([group.id]);
    expect(await find(group.id)).toMatchObject({ usedByItems: 1 });
    expect(item.variants[0]?.modifierGroups.map((linked) => linked.id)).toEqual([group.id]);

    const names = (await list()).map((listed) => listed.name);
    expect(names).toEqual([...names].sort());
    await waitFor(changed, 1);
    expect(changed[0]).toEqual({ itemIds: [] });
  });

  it('AC-2: refuses rule violations and an option of another group', async () => {
    const other = (await post(ice()).expect(201)).body.data as ModifierGroupAdmin;
    const bad = [
      { ...ice(), minSelect: 0 },
      { ...ice(), isRequired: false },
      { ...ice(), minSelect: 2, maxSelect: 1 },
      { ...ice(), maxSelect: 4 },
      { ...ice(), options: [{ name: 'ปกติ', priceDelta: '-1.00' }], maxSelect: 1 },
      { ...ice(), options: [], maxSelect: 1 },
    ];
    for (const body of bad) {
      const refused = await post(body);
      expect(refused.status).toBe(400);
      expect(refused.body.code).toBe('VALIDATION_ERROR');
    }
    const group = (await post({ ...ice(), name: 'อีกกลุ่ม' }).expect(201)).body.data as ModifierGroupAdmin;
    const foreign = other.options[0]?.id;
    const wrong = await patch(group.id, { ...form(group), options: [{ id: foreign, name: 'ปกติ', priceDelta: '0.00' }], maxSelect: 1 });
    expect(wrong.status).toBe(400);
    expect((await patch(UNKNOWN, form(group))).status).toBe(404);
    expect(await count(`SELECT COUNT(*) AS n FROM modifier_group WHERE name = 'อีกกลุ่ม'`)).toBe(1);
  });

  it('AC-3: a dropped option keeps its old lines but can no longer be ordered', async () => {
    const group = (await post(toppings()).expect(201)).body.data as ModifierGroupAdmin;
    const [cheese, bacon, egg] = group.options;
    const item = await createItem([group.id]);
    const visitId = await open('T1');
    const variantId = item.variants[0]?.id ?? '';
    const first = await place(visitId, variantId, [cheese?.id ?? '', bacon?.id ?? '']);

    const changed = await listen();
    const edited = await patch(group.id, {
      ...form(group),
      maxSelect: 2,
      options: [
        { id: cheese?.id, name: 'ชีสเยิ้ม', priceDelta: '25.00' },
        { id: egg?.id, name: 'ไข่ดาว', priceDelta: '10.00' },
      ],
    }).expect(200);
    const after = edited.body.data as ModifierGroupAdmin;
    expect(after.options.map((option) => [option.name, option.priceDelta, option.isAvailable])).toEqual([
      ['ชีสเยิ้ม', '25.00', true],
      ['เบคอน', '15.00', false],
      ['ไข่ดาว', '10.00', true],
    ]);
    expect(await count(`SELECT COUNT(*) AS n FROM modifier_option WHERE group_id = '${group.id}'`)).toBe(3);

    const kept = (await lines(first))[0]?.modifiers ?? [];
    expect(Object.fromEntries(kept.map((m) => [m.name, m.priceDelta]))).toEqual({ ชีส: '20.00', เบคอน: '15.00' });
    const reread = (await get(`/api/menu/items/${item.id}`).expect(200)).body.data as MenuItem;
    expect(reread.variants[0]?.modifierGroups[0]?.options.find((o) => o.id === bacon?.id)).toMatchObject({ isAvailable: false });

    const refused = await order(visitId, variantId, [bacon?.id ?? '']);
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('ITEM_UNAVAILABLE');
    const fresh = await place(visitId, variantId, [cheese?.id ?? '']);
    expect((await lines(fresh))[0]?.modifiers).toMatchObject([{ name: 'ชีสเยิ้ม', priceDelta: '25.00' }]);

    await waitFor(changed, 1);
    expect(changed).toEqual([{ itemIds: [item.id] }]);
  });

  it('AC-4: a group in use is refused; once unlinked it is archived and stays readable on old orders', async () => {
    const group = (await post(toppings()).expect(201)).body.data as ModifierGroupAdmin;
    const item = await createItem([group.id]);
    const visitId = await open('T2');
    const variantId = item.variants[0]?.id ?? '';
    const placed = await place(visitId, variantId, [group.options[0]?.id ?? '']);

    const changed = await listen();
    const refused = await remove(group.id);
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('MODIFIER_GROUP_IN_USE');
    expect(refused.body.message).toContain('1');
    expect(await find(group.id)).toBeDefined();

    const current = (await get(`/api/menu/items/${item.id}`).expect(200)).body.data as MenuItem;
    await patchItem(current, { modifierGroupIds: [] }).expect(200);
    await remove(group.id).expect(200);
    expect(await find(group.id)).toBeUndefined();
    expect(await one(`SELECT is_active AS active FROM modifier_group WHERE id = $1`, [group.id])).toEqual({ active: false });
    expect(await count(`SELECT COUNT(*) AS n FROM modifier_option WHERE group_id = '${group.id}'`)).toBe(3);
    expect((await lines(placed))[0]?.modifiers.map((m) => m.name)).toEqual(['ชีส']);

    expect((await remove(group.id)).status).toBe(404);
    expect((await remove(UNKNOWN)).status).toBe(404);
    const relinked = await get(`/api/menu/items/${item.id}`).expect(200);
    expect((await patchItem(relinked.body.data as MenuItem, { modifierGroupIds: [group.id] })).status).toBe(400);
    const born = { ...itemBody(await categoryId()), modifierGroupIds: [group.id] };
    expect((await request(app.getHttpServer()).post('/api/menu/items').set(auth()).send(born)).status).toBe(400);

    const unused = (await post({ ...toppings(), name: 'ไม่เคยใช้' }).expect(201)).body.data as ModifierGroupAdmin;
    await remove(unused.id).expect(200);
    expect(await find(unused.id)).toBeUndefined();
    // The item unlink, the archive, then the second group's create and archive.
    await waitFor(changed, 4);
    expect(changed).toEqual([{ itemIds: [item.id] }, { itemIds: [] }, { itemIds: [] }, { itemIds: [] }]);
  });

  it('AC-4: linking and archiving at the same moment never leaves an archived group linked', async () => {
    for (let round = 0; round < 5; round += 1) {
      const group = (await post({ ...toppings(), name: `แข่ง ${round}` }).expect(201)).body.data as ModifierGroupAdmin;
      const item = await createItem([]);
      const [archived, linked] = await Promise.all([remove(group.id), patchItem(item, { modifierGroupIds: [group.id] })]);
      expect([archived.status, linked.status]).toSatisfy((pair: number[]) => pair[0] === 200 ? pair[1] === 400 : pair[0] === 409 && pair[1] === 200);
      const stuck = await count(
        `SELECT COUNT(*) AS n FROM menu_variant_modifier_group WHERE modifier_group_id = '${group.id}'
         AND EXISTS (SELECT 1 FROM modifier_group WHERE id = '${group.id}' AND NOT is_active)`,
      );
      expect(stuck).toBe(0);
    }
  });

  it('AC-5: every write emits exactly one menu.changed', async () => {
    const changed = await listen();
    const group = (await post(ice()).expect(201)).body.data as ModifierGroupAdmin;
    await patch(group.id, form(group)).expect(200);
    await remove(group.id).expect(200);
    await pause(150);
    expect(changed).toHaveLength(3);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function get(path: string) {
    return request(app.getHttpServer()).get(path).set(auth());
  }

  function post(body: unknown) {
    return request(app.getHttpServer()).post(GROUPS).set(auth()).send(body as object);
  }

  function patch(id: string, body: unknown) {
    return request(app.getHttpServer()).patch(`${GROUPS}/${id}`).set(auth()).send(body as object);
  }

  function remove(id: string) {
    return request(app.getHttpServer()).delete(`${GROUPS}/${id}`).set(auth());
  }

  function patchItem(item: MenuItem, overrides: Record<string, unknown>) {
    const body = {
      ...itemBody(item.categoryId),
      name: item.name,
      variants: item.variants.filter((v) => v.isAvailable).map((v) => ({ id: v.id, name: v.name, price: v.price })),
      updatedAt: item.updatedAt,
      ...overrides,
    };
    return request(app.getHttpServer()).patch(`/api/menu/items/${item.id}`).set(auth()).send(body);
  }

  async function createItem(modifierGroupIds: string[]): Promise<MenuItem> {
    const body = { ...itemBody(await categoryId()), modifierGroupIds };
    return (await request(app.getHttpServer()).post('/api/menu/items').set(auth()).send(body).expect(201)).body.data as MenuItem;
  }

  async function list(): Promise<ModifierGroupAdmin[]> {
    return (await get(GROUPS).expect(200)).body.data.items as ModifierGroupAdmin[];
  }

  async function find(id: string): Promise<ModifierGroupAdmin | undefined> {
    return (await list()).find((group) => group.id === id);
  }

  async function categoryId(): Promise<string> {
    return (await one(`SELECT id FROM menu_category WHERE name = 'ค็อกเทล'`)).id as string;
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
    const opened = await request(app.getHttpServer()).post('/api/visits').set(auth()).send({ tableSeatId: seat.id }).expect(201);
    return opened.body.data.visit.id as string;
  }

  function order(visitId: string, variantId: string, modifierOptionIds: string[]) {
    return request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId, quantity: 1, modifierOptionIds }] });
  }

  async function place(visitId: string, variantId: string, modifierOptionIds: string[]): Promise<Order> {
    return (await order(visitId, variantId, modifierOptionIds).expect(201)).body.data as Order;
  }

  async function lines(placed: Order): Promise<OrderLine[]> {
    const reloaded = (await get(`/api/orders/${placed.id}`).expect(200)).body.data as Order;
    return reloaded.tickets.flatMap((ticket) => ticket.items);
  }

  async function listen(): Promise<unknown[]> {
    const received: unknown[] = [];
    const socket = await connect();
    socket.on('menu.changed', (payload) => received.push(payload));
    return received;
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

function ice() {
  return {
    name: 'ระดับน้ำแข็ง',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: 'ปกติ', priceDelta: '0.00' },
      { name: 'น้อย', priceDelta: '0.00' },
      { name: 'ไม่ใส่', priceDelta: '5.00' },
    ],
  };
}

function toppings() {
  return {
    name: 'ท็อปปิ้ง',
    isRequired: false,
    minSelect: 0,
    maxSelect: 2,
    options: [
      { name: 'ชีส', priceDelta: '20.00' },
      { name: 'เบคอน', priceDelta: '15.00' },
      { name: 'ไข่', priceDelta: '10.00' },
    ],
  };
}

/** The PATCH body that changes nothing. */
function form(group: ModifierGroupAdmin) {
  return {
    name: group.name,
    isRequired: group.isRequired,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: group.options.filter((o) => o.isAvailable).map((o) => ({ id: o.id, name: o.name, priceDelta: o.priceDelta })),
  };
}

function itemBody(categoryId: string) {
  return {
    categoryId,
    name: 'เมนูทดสอบ',
    itemType: 'simple',
    station: 'bar',
    isPromo: false,
    variants: [{ name: 'ปกติ', price: '100.00' }],
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
