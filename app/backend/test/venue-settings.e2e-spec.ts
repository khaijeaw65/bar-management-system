import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { VENUE_SETTINGS_CHANGED, type Order } from '@bar/contracts';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

describe('Venue settings (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let staffId: string;

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
    staffId = await insertStaff(dataSource, 'เจ้าของ');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('saves a change, audits only that field, and skips an unchanged value (AC-1)', async () => {
    const emit = vi.spyOn(app.get(NotificationsService), 'emitToStaff');
    const patched = await patch({ kitchenDisplayEnabled: true }).expect(200);
    expect(patched.body.data.kitchenDisplayEnabled).toBe(true);

    const venue = await request(app.getHttpServer()).get('/api/venue').set(auth()).expect(200);
    expect(venue.body.data.kitchenDisplayEnabled).toBe(true);
    expect(await auditRows()).toEqual([
      {
        action: 'UPDATE',
        changed_by: staffId,
        changed_fields: { kitchen_display_enabled: { from: 'false', to: 'true' } },
      },
    ]);

    await patch({ kitchenDisplayEnabled: true }).expect(200);
    expect(await auditRows()).toHaveLength(1);
    expect(settingsEvents(emit)).toHaveLength(1);
  });

  it('records several fields in one audit row and emits the new settings once (AC-4)', async () => {
    const emit = vi.spyOn(app.get(NotificationsService), 'emitToStaff');
    const patched = await patch({ name: '  ร้านใหม่  ', businessDayCutoff: '05:00', counterQrEnabled: false })
      .expect(200);
    expect(patched.body.data).toMatchObject({ name: 'ร้านใหม่', businessDayCutoff: '05:00' });

    const rows = await auditRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.changed_fields).toEqual({
      name: { from: expect.any(String), to: 'ร้านใหม่' },
      business_day_cutoff: { from: '06:00', to: '05:00' },
    });
    const events = settingsEvents(emit);
    expect(events).toHaveLength(1);
    expect(events[0]?.[1]).toEqual({ settings: patched.body.data, updatedAt: expect.any(String) });
  });

  it.each([
    [{ businessDayCutoff: '25:00' }],
    [{ businessDayCutoff: '6:00' }],
    [{ name: '   ' }],
    [{}],
    [{ kitchenDisplayEnabled: 'yes' }],
  ])('rejects %j with 400 VALIDATION_ERROR (AC-2)', async (body) => {
    const response = await patch(body);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(await auditRows()).toHaveLength(0);
  });

  it('splits tickets for orders placed after the kitchen screen is turned on (AC-3)', async () => {
    const visitId = await openSeat('T1');
    const before = await placeSnackAndBeer(visitId);
    expect(before.tickets.map((ticket) => ticket.station)).toEqual(['bar']);

    await patch({ kitchenDisplayEnabled: true }).expect(200);
    const after = await placeSnackAndBeer(visitId);
    expect(after.tickets.map((ticket) => ticket.station).sort()).toEqual(['bar', 'food']);

    const kept = await request(app.getHttpServer()).get(`/api/visits/${visitId}`).set(auth()).expect(200);
    const first = (kept.body.data.orders as Order[]).find((order) => order.id === before.id);
    expect(first?.tickets.map((ticket) => ticket.station)).toEqual(['bar']);
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function patch(body: object): request.Test {
    return request(app.getHttpServer()).patch('/api/venue/settings').set(auth()).send(body);
  }

  function settingsEvents(emit: { mock: { calls: unknown[][] } }): unknown[][] {
    return emit.mock.calls.filter((call) => call[0] === VENUE_SETTINGS_CHANGED);
  }

  async function auditRows(): Promise<AuditRow[]> {
    const venue = await dataSource.query(`SELECT id FROM venue`);
    return dataSource.query(
      `SELECT action, changed_fields, changed_by
       FROM audit_log WHERE entity = 'venue' AND entity_id = $1
       ORDER BY changed_at ASC`,
      [venue[0].id],
    );
  }

  async function openSeat(label: string): Promise<string> {
    const seats: Array<{ id: string }> = await dataSource.query(
      `SELECT id FROM table_seat WHERE label = $1`,
      [label],
    );
    const response = await request(app.getHttpServer())
      .post('/api/visits')
      .set(auth())
      .send({ tableSeatId: seats[0]?.id })
      .expect(201);
    return response.body.data.visit.id as string;
  }

  async function placeSnackAndBeer(visitId: string): Promise<Order> {
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v
       JOIN menu_item i ON i.id = v.menu_item_id
       WHERE (i.name = 'ช้างดราฟต์' AND v.name = 'ปกติ') OR i.name = 'ถั่วทอดสมุนไพร'`,
    );
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: variants.map((variant) => ({ variantId: variant.id, quantity: 1 })) })
      .expect(201);
    return response.body.data as Order;
  }
});

interface AuditRow {
  action: string;
  changed_fields: unknown;
  changed_by: string | null;
}
