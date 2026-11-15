import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PERMISSION_CATALOG, type Order } from '@bar/contracts';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { DEFAULT_POLICY_IDS } from '../src/modules/iam/domain/default-groups.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('Void & Comp with PIN Approval (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let managerId: string;
  let staffId: string;
  let otherStaffId: string;
  let managerToken: string;
  let staffToken: string;
  let beerVariantId: string;
  let foodVariantId: string;
  let corkageVariantId: string;

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
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();

    managerId = await insertStaff(dataSource, 'Manager M', 'ผู้จัดการ');
    staffId = await insertStaff(dataSource, 'Staff S', 'พนักงาน');
    otherStaffId = await insertStaff(dataSource, 'Staff Other', 'พนักงาน');

    managerToken = (await staffSession(app, managerId)).accessToken;
    staffToken = (await staffSession(app, staffId)).accessToken;
    const otherStaffToken = (await staffSession(app, otherStaffId)).accessToken;

    await seedVenue(dataSource);
    await seedMenu(dataSource);
    await dataSource.query(
      `UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`,
    );

    // Set Manager PIN = 2468
    await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(managerToken))
      .send({ pin: '2468' })
      .expect(200);

    // Set Other Staff PIN = 1111 (staff without orders:void)
    await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(otherStaffToken))
      .send({ pin: '1111' })
      .expect(200);

    // Load menu variant IDs
    const beerRows: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ช้างดราฟต์' AND v.name = 'ปกติ' LIMIT 1`,
    );
    beerVariantId = beerRows[0]!.id;

    const foodRows: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ถั่วทอดสมุนไพร' AND v.name = 'ปกติ' LIMIT 1`,
    );
    foodVariantId = foodRows[0]!.id;

    const corkageRows: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v JOIN menu_item i ON i.id = v.menu_item_id WHERE i.name = 'ค่าเปิดขวด' AND v.name = 'ปกติ' LIMIT 1`,
    );
    corkageVariantId = corkageRows[0]!.id;
  });

  async function openSeat(label = 'T1'): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = $1`,
      [label],
    );
    const seatId = seats[0]!.id;
    const res = await request(app.getHttpServer())
      .post('/api/visits')
      .set(bearer(staffToken))
      .send({ tableSeatId: seatId })
      .expect(201);
    return res.body.data.visit.id;
  }

  async function placeOrder(visitId: string, items: Array<{ variantId: string; quantity: number }>): Promise<Order> {
    const res = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(bearer(staffToken))
      .send({ items })
      .expect(201);
    return res.body.data as Order;
  }

  it('AC-1: approved void — staff voids line with manager PIN -> sets cancel_kind=void, drops bill, records audit', async () => {
    const visitId = await openSeat('T1');
    const order = await placeOrder(visitId, [
      { variantId: beerVariantId, quantity: 1 },
      { variantId: foodVariantId, quantity: 1 },
    ]);

    const beerItem = order.tickets.flatMap((t) => t.items).find((i) => i.variantId === beerVariantId)!;

    const res = await request(app.getHttpServer())
      .post(`/api/order-items/${beerItem.id}/void`)
      .set(bearer(staffToken))
      .send({
        reason: 'spoiled',
        note: 'dropped by customer',
        pin: '2468',
      })
      .expect(200);

    expect(res.body.data).toMatchObject({
      id: beerItem.id,
      cancelledAt: expect.any(String),
      comp: null,
      cancellation: {
        reason: 'spoiled',
        by: { staffId, displayName: 'Staff S' },
        approvedBy: { staffId: managerId, displayName: 'Manager M' },
        selfApproved: false,
      },
    });

    // Check DB row
    const itemRows: Array<{ cancel_kind: string; cancelled_by: string; approved_by: string; cancel_note: string; cancelled_at: Date }> =
      await dataSource.query(
        `SELECT cancel_kind, cancelled_by, approved_by, cancel_note, cancelled_at FROM order_item WHERE id = $1`,
        [beerItem.id],
      );
    expect(itemRows[0]?.cancel_kind).toBe('void');
    expect(itemRows[0]?.cancelled_by).toBe(staffId);
    expect(itemRows[0]?.approved_by).toBe(managerId);
    expect(itemRows[0]?.cancel_note).toBe('dropped by customer');
    expect(itemRows[0]?.cancelled_at).toBeDefined();

    // Check bill total dropped (beer was 120.00, food is 80.00)
    const orderRes = await request(app.getHttpServer())
      .get(`/api/orders/${order.id}`)
      .set(bearer(staffToken))
      .expect(200);
    // Voided line excluded from bill total
    expect(orderRes.body.data.total).toBe('80.00');

    // Check audit row
    const auditRows: Array<{ entity: string; entity_id: string; action: string; changed_fields: Record<string, unknown> }> =
      await dataSource.query(
        `SELECT entity, entity_id, action, changed_fields FROM audit_log WHERE entity = 'order_item' AND entity_id = $1`,
        [beerItem.id],
      );
    expect(auditRows.length).toBeGreaterThan(0);
    expect(auditRows[0]?.action).toBe('UPDATE');
    expect(auditRows[0]?.changed_fields).toMatchObject({
      cancelKind: { from: null, to: 'void' },
      cancelReason: { from: null, to: 'spoiled' },
      approvedBy: { from: null, to: managerId },
      selfApproved: { from: null, to: 'false' },
    });
  });

  it('AC-2: comp — staff comps line with manager PIN -> line stays with 0.00 total, comp object, ticket status unchanged', async () => {
    const visitId = await openSeat('T1');
    const order = await placeOrder(visitId, [
      { variantId: beerVariantId, quantity: 1 },
      { variantId: foodVariantId, quantity: 1 },
    ]);

    const beerItem = order.tickets.flatMap((t) => t.items).find((i) => i.variantId === beerVariantId)!;
    const ticketId = order.tickets[0]!.id;

    const res = await request(app.getHttpServer())
      .post(`/api/order-items/${beerItem.id}/comp`)
      .set(bearer(staffToken))
      .send({
        reason: 'special_service',
        note: 'VIP customer',
        pin: '2468',
      })
      .expect(200);

    expect(res.body.data).toMatchObject({
      id: beerItem.id,
      cancelledAt: null,
      cancellation: null,
      lineTotal: '0.00',
      comp: {
        reason: 'special_service',
        note: 'VIP customer',
        by: { staffId, displayName: 'Staff S' },
        approvedBy: { staffId: managerId, displayName: 'Manager M' },
        selfApproved: false,
      },
    });

    // Check DB row
    const itemRows: Array<{ cancel_kind: string; cancelled_by: string; approved_by: string }> =
      await dataSource.query(
        `SELECT cancel_kind, cancelled_by, approved_by FROM order_item WHERE id = $1`,
        [beerItem.id],
      );
    expect(itemRows[0]?.cancel_kind).toBe('comp');
    expect(itemRows[0]?.cancelled_by).toBe(staffId);
    expect(itemRows[0]?.approved_by).toBe(managerId);

    // Bill total drops by beer price (total is now food only = 80.00)
    const orderRes = await request(app.getHttpServer())
      .get(`/api/orders/${order.id}`)
      .set(bearer(staffToken))
      .expect(200);
    expect(orderRes.body.data.total).toBe('80.00');

    // Ticket status unchanged
    const ticketRows: Array<{ status: string }> = await dataSource.query(
      `SELECT status FROM order_ticket WHERE id = $1`,
      [ticketId],
    );
    expect(ticketRows[0]?.status).toBe('pending');
  });

  it('AC-3: self-approve — manager voids with no PIN; staff without code and no PIN gets 403', async () => {
    const visitId = await openSeat('T1');
    const order = await placeOrder(visitId, [{ variantId: beerVariantId, quantity: 1 }]);
    const beerItem = order.tickets[0]!.items[0]!;

    // Manager voids without PIN -> selfApproved: true, approved_by NULL
    const mgrRes = await request(app.getHttpServer())
      .post(`/api/order-items/${beerItem.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(200);

    expect(mgrRes.body.data.cancellation).toMatchObject({
      selfApproved: true,
      approvedBy: null,
    });

    const rows: Array<{ approved_by: string | null }> = await dataSource.query(
      `SELECT approved_by FROM order_item WHERE id = $1`,
      [beerItem.id],
    );
    expect(rows[0]?.approved_by).toBeNull();

    // Staff without code and no PIN -> 403
    const visitId2 = await openSeat('T2');
    const order2 = await placeOrder(visitId2, [{ variantId: foodVariantId, quantity: 1 }]);
    const foodItem = order2.tickets[0]!.items[0]!;

    const staffRes = await request(app.getHttpServer())
      .post(`/api/order-items/${foodItem.id}/void`)
      .set(bearer(staffToken))
      .send({ reason: 'wrong_order' })
      .expect(403);

    expect(staffRes.body.code).toBe('FORBIDDEN');
  });

  it('AC-4: wrong PIN returns 422 PIN_INVALID; 6th wrong try in 5 min returns 429 PIN_LOCKED', async () => {
    const visitId = await openSeat('T1');
    const order = await placeOrder(visitId, [{ variantId: beerVariantId, quantity: 1 }]);
    const beerItem = order.tickets[0]!.items[0]!;

    // 1. PIN matches nobody -> 422
    const res1 = await request(app.getHttpServer())
      .post(`/api/order-items/${beerItem.id}/void`)
      .set(bearer(staffToken))
      .send({ reason: 'wrong_order', pin: '0000' })
      .expect(422);
    expect(res1.body.code).toBe('PIN_INVALID');

    // 2. PIN belongs to staff without orders:void code -> 422
    const res2 = await request(app.getHttpServer())
      .post(`/api/order-items/${beerItem.id}/void`)
      .set(bearer(staffToken))
      .send({ reason: 'wrong_order', pin: '1111' })
      .expect(422);
    expect(res2.body.code).toBe('PIN_INVALID');

    // 3, 4, 5 wrong tries -> 422
    for (let i = 3; i <= 5; i++) {
      const res = await request(app.getHttpServer())
        .post(`/api/order-items/${beerItem.id}/void`)
        .set(bearer(staffToken))
        .send({ reason: 'wrong_order', pin: '0000' })
        .expect(422);
      expect(res.body.code).toBe('PIN_INVALID');
    }

    // 6th try -> 429 PIN_LOCKED (even with correct manager PIN)
    const lockedRes = await request(app.getHttpServer())
      .post(`/api/order-items/${beerItem.id}/void`)
      .set(bearer(staffToken))
      .send({ reason: 'wrong_order', pin: '2468' })
      .expect(429);

    expect(lockedRes.body.code).toBe('PIN_LOCKED');
  });

  it('AC-5: money moved — pending payment -> 409 PAYMENT_IN_FLIGHT; completed payment -> 409 VISIT_PAID', async () => {
    // 1. Pending payment
    const visitId1 = await openSeat('T1');
    const order1 = await placeOrder(visitId1, [{ variantId: beerVariantId, quantity: 1 }]);
    const item1 = order1.tickets[0]!.items[0]!;

    // Create promptpay payment -> pending
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId1}/payments`)
      .set(bearer(staffToken))
      .send({ method: 'promptpay', mode: 'merge' })
      .expect(201);

    const pendingRes = await request(app.getHttpServer())
      .post(`/api/order-items/${item1.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(409);
    expect(pendingRes.body.code).toBe('PAYMENT_IN_FLIGHT');

    // 2. Completed payment
    const visitId2 = await openSeat('T2');
    const order2 = await placeOrder(visitId2, [{ variantId: beerVariantId, quantity: 1 }]);
    const item2 = order2.tickets[0]!.items[0]!;

    // Pay with cash -> completed immediately
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId2}/payments`)
      .set(bearer(staffToken))
      .send({ method: 'cash', mode: 'merge' })
      .expect(201);

    const paidRes = await request(app.getHttpServer())
      .post(`/api/order-items/${item2.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(409);
    expect(paidRes.body.code).toBe('VISIT_PAID');
  });

  it('AC-6: last item — voiding last active item cancels ticket; comping last item keeps ticket active', async () => {
    // 1. Void last item of ticket
    const visitId1 = await openSeat('T1');
    const order1 = await placeOrder(visitId1, [{ variantId: beerVariantId, quantity: 1 }]);
    const ticket1 = order1.tickets[0]!;
    const item1 = ticket1.items[0]!;

    await request(app.getHttpServer())
      .post(`/api/order-items/${item1.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(200);

    const t1Rows: Array<{ status: string }> = await dataSource.query(
      `SELECT status FROM order_ticket WHERE id = $1`,
      [ticket1.id],
    );
    expect(t1Rows[0]?.status).toBe('cancelled');

    // 2. Comp last item of ticket
    const visitId2 = await openSeat('T2');
    const order2 = await placeOrder(visitId2, [{ variantId: beerVariantId, quantity: 1 }]);
    const ticket2 = order2.tickets[0]!;
    const item2 = ticket2.items[0]!;

    await request(app.getHttpServer())
      .post(`/api/order-items/${item2.id}/comp`)
      .set(bearer(managerToken))
      .send({ reason: 'special_service' })
      .expect(200);

    const t2Rows: Array<{ status: string }> = await dataSource.query(
      `SELECT status FROM order_ticket WHERE id = $1`,
      [ticket2.id],
    );
    expect(t2Rows[0]?.status).toBe('pending');
  });

  it('AC-7: twice & concurrency — duplicate adjustment gives 409; concurrent voids allow exactly one', async () => {
    const visitId = await openSeat('T1');
    const order = await placeOrder(visitId, [{ variantId: beerVariantId, quantity: 1 }]);
    const item = order.tickets[0]!.items[0]!;

    // Void once
    await request(app.getHttpServer())
      .post(`/api/order-items/${item.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(200);

    // Void second time -> 409
    const secondRes = await request(app.getHttpServer())
      .post(`/api/order-items/${item.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(409);
    expect(secondRes.body.code).toBe('INVALID_STATE_TRANSITION');

    // Concurrent voids on new item
    const visitId2 = await openSeat('T2');
    const order2 = await placeOrder(visitId2, [{ variantId: foodVariantId, quantity: 1 }]);
    const item2 = order2.tickets[0]!.items[0]!;

    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/order-items/${item2.id}/void`)
        .set(bearer(managerToken))
        .send({ reason: 'wrong_order' }),
      request(app.getHttpServer())
        .post(`/api/order-items/${item2.id}/void`)
        .set(bearer(managerToken))
        .send({ reason: 'wrong_order' }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('AC-9: totals — bill, payment amount, customer tab, and reports day total all exclude void and treat comp as 0.00', async () => {
    const seatRows: Array<{ id: string; qr_token: string }> = await dataSource.query(
      `SELECT id, qr_token FROM table_seat WHERE label = 'T1'`,
    );
    const seatId = seatRows[0]!.id;
    const qrToken = seatRows[0]!.qr_token;

    // Open visit
    const visitRes = await request(app.getHttpServer())
      .post('/api/visits')
      .set(bearer(staffToken))
      .send({ tableSeatId: seatId })
      .expect(201);
    const visitId = visitRes.body.data.visit.id;

    // Scan customer session
    const scanRes = await request(app.getHttpServer())
      .post('/api/customer/sessions')
      .send({ qrToken })
      .expect(201);
    const cookieHeader = String(scanRes.headers['set-cookie']);
    const guestCookie = /guest_session=([^;]+)/.exec(cookieHeader)?.[1] ?? '';

    // Place 3 items:
    // Item 1: Active beer (120.00)
    // Item 2: Voided food (80.00)
    // Item 3: Comped corkage (300.00)
    const order = await placeOrder(visitId, [
      { variantId: beerVariantId, quantity: 1 },
      { variantId: foodVariantId, quantity: 1 },
      { variantId: corkageVariantId, quantity: 1 },
    ]);

    const items = order.tickets.flatMap((t) => t.items);
    const itemToVoid = items.find((i) => i.variantId === foodVariantId)!;
    const itemToComp = items.find((i) => i.variantId === corkageVariantId)!;

    // Void food
    await request(app.getHttpServer())
      .post(`/api/order-items/${itemToVoid.id}/void`)
      .set(bearer(managerToken))
      .send({ reason: 'wrong_order' })
      .expect(200);

    // Comp corkage
    await request(app.getHttpServer())
      .post(`/api/order-items/${itemToComp.id}/comp`)
      .set(bearer(managerToken))
      .send({ reason: 'special_service' })
      .expect(200);

    // 1. Bill total check: only 1 active beer (120.00)
    const orderRes = await request(app.getHttpServer())
      .get(`/api/orders/${order.id}`)
      .set(bearer(staffToken))
      .expect(200);
    expect(orderRes.body.data.total).toBe('120.00');

    // 2. Customer tab check
    const tabRes = await request(app.getHttpServer())
      .get('/api/customer/tab')
      .set('Cookie', `guest_session=${guestCookie}`)
      .expect(200);
    expect(tabRes.body.data.total).toBe('120.00');
    // Tab contains comp item with isComp = true and 0.00, voided item with cancelled = true
    const allLines = tabRes.body.data.orders.flatMap(
      (o: { lines: Array<{ itemName: string; isComp: boolean; lineTotal: string; cancelled: boolean }> }) => o.lines,
    );
    const tabComp = allLines.find((l: { itemName: string }) => l.itemName === itemToComp.name);
    expect(tabComp).toBeDefined();
    expect(tabComp?.isComp).toBe(true);
    expect(tabComp?.lineTotal).toBe('0.00');

    const tabVoid = allLines.find((l: { itemName: string }) => l.itemName === itemToVoid.name);
    expect(tabVoid).toBeDefined();
    expect(tabVoid?.cancelled).toBe(true);

    const tabBeer = allLines.find((l: { itemName: string }) => l.itemName === 'ช้างดราฟต์');
    expect(tabBeer).toBeDefined();
    expect(tabBeer?.cancelled).toBe(false);
    expect(tabBeer?.isComp).toBe(false);
    expect(tabBeer?.lineTotal).toBe('120.00');

    // 3. Payment amount check: creating payment calculates total as 120.00
    const paymentRes = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set(bearer(staffToken))
      .send({ method: 'cash', mode: 'merge' })
      .expect(201);
    expect(paymentRes.body.data.total).toBe('120.00');
    expect(paymentRes.body.data.parts[0].amount).toBe('120.00');

    // 4. Reports day total check: openSeats and revenue exclude void and count comp as 0
    const todayRes = await request(app.getHttpServer())
      .get('/api/reports/today')
      .set(bearer(managerToken))
      .expect(200);
    expect(todayRes.body.data.revenue).toBe('120.00');
  });

  it('AC-10: catalog — orders:void and orders:comp exist; held by ทั้งหมด and จัดการร้าน; not held by งานพนักงาน', async () => {
    // 1. Check PERMISSION_CATALOG
    const codesInCatalog = PERMISSION_CATALOG.flatMap((g) => g.actions.map((a) => a.code));
    expect(codesInCatalog).toContain('orders:void');
    expect(codesInCatalog).toContain('orders:comp');

    // 2. Query policy_permission in database
    const allPolicyPerms: Array<{ code: string }> = await dataSource.query(
      `SELECT p.resource || ':' || p.action AS code
       FROM permission p
       JOIN policy_permission pp ON pp.permission_id = p.id
       WHERE pp.policy_id = $1`,
      [DEFAULT_POLICY_IDS.all],
    );
    const allCodes = allPolicyPerms.map((r) => r.code);
    expect(allCodes).toContain('orders:void');
    expect(allCodes).toContain('orders:comp');

    const mgrPolicyPerms: Array<{ code: string }> = await dataSource.query(
      `SELECT p.resource || ':' || p.action AS code
       FROM permission p
       JOIN policy_permission pp ON pp.permission_id = p.id
       WHERE pp.policy_id = $1`,
      [DEFAULT_POLICY_IDS.manager],
    );
    const mgrCodes = mgrPolicyPerms.map((r) => r.code);
    expect(mgrCodes).toContain('orders:void');
    expect(mgrCodes).toContain('orders:comp');

    const staffPolicyPerms: Array<{ code: string }> = await dataSource.query(
      `SELECT p.resource || ':' || p.action AS code
       FROM permission p
       JOIN policy_permission pp ON pp.permission_id = p.id
       WHERE pp.policy_id = $1`,
      [DEFAULT_POLICY_IDS.staff],
    );
    const staffCodes = staffPolicyPerms.map((r) => r.code);
    expect(staffCodes).not.toContain('orders:void');
    expect(staffCodes).not.toContain('orders:comp');
  });
});
