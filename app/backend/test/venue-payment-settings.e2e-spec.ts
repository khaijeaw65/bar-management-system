import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

const MOBILE = '0812345678';
const MOBILE_DASHED = '081-234-5678';
const OTHER_MOBILE = '0899999999';
const QR_FOR_ONE_BAHT =
  '00020101021229370016A000000677010111011300668123456785802TH530376454041.236304BFA6';

describe('Venue payment settings (e2e)', () => {
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
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    staffId = await insertStaff(dataSource, 'เจ้าของ');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('stores a mobile number, masks it, and leaves GET /venue without payment fields', async () => {
    const logs = captureOutput();
    try {
    const before = await settings().expect(200);
    expect(before.body.data).toEqual({
      paymentMode: 'own_promptpay',
      promptpayIdType: null,
      promptpayIdMasked: null,
    });

    const patched = await patch(MOBILE_DASHED, 'mobile').expect(200);
    expect(patched.body.data).toEqual({
      paymentMode: 'own_promptpay',
      promptpayIdType: 'mobile',
      promptpayIdMasked: 'XXX-XXX-5678',
    });
    expect(JSON.stringify(patched.body)).not.toContain(MOBILE);

    const after = await settings().expect(200);
    expect(after.body.data.promptpayIdMasked).toBe('XXX-XXX-5678');
    const venue = await request(app.getHttpServer()).get('/api/venue').set(auth()).expect(200);
    expect(venue.body.data).not.toHaveProperty('promptpayId');
    expect(venue.body.data).not.toHaveProperty('promptpayIdMasked');
    expect(venue.body.data).not.toHaveProperty('promptpayIdType');
    expect(venue.body.data).not.toHaveProperty('paymentMode');

    const row = await venueRow();
    expect(row.promptpay_id).toBe(MOBILE);
    expect(row.promptpay_id_type).toBe('mobile');
    expect(logs.text()).not.toContain(MOBILE);
    expect(logs.text()).not.toContain(MOBILE_DASHED);
    } finally {
      logs.stop();
    }
  });

  it('rejects a bad format, a bad national-id check digit, and a type mismatch', async () => {
    await expectRejected('081234567', 'mobile');
    await expectRejected('1111111111118', 'national_id');
    await expectRejected('1111111111119', 'mobile');
    const row = await venueRow();
    expect(row.promptpay_id).toBeNull();
  });

  it('writes one masked audit row per real change and skips an unchanged value', async () => {
    const logs = captureOutput();
    try {
    await patch(MOBILE_DASHED, 'mobile').expect(200);
    await patch('081 234 5678', 'mobile').expect(200);
    await patch(OTHER_MOBILE, 'mobile').expect(200);

    const rows = await auditRows();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      entity: 'venue',
      action: 'UPDATE',
      changed_by: staffId,
      changed_fields: {
        promptpay_id: { from: null, to: 'XXX-XXX-5678' },
        promptpay_id_type: { from: null, to: 'mobile' },
      },
    });
    expect(rows[1]?.changed_fields).toEqual({
      promptpay_id: { from: 'XXX-XXX-5678', to: 'XXX-XXX-9999' },
      promptpay_id_type: { from: 'mobile', to: 'mobile' },
    });
    const stored = JSON.stringify(rows);
    expect(stored).not.toContain(MOBILE);
    expect(stored).not.toContain(OTHER_MOBILE);
    expect(logs.text()).not.toContain(MOBILE);
    expect(logs.text()).not.toContain(MOBILE_DASHED);
    expect(logs.text()).not.toContain(OTHER_MOBILE);
    } finally {
      logs.stop();
    }
  });

  it('blocks a change while any visit has a pending payment, then allows it', async () => {
    await patch(MOBILE, 'mobile').expect(200);
    const visitId = await openSeat('T3');
    await placeBeer(visitId);
    const pending = await pay(visitId);
    const blocked = await patch(OTHER_MOBILE, 'mobile');
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('PAYMENT_IN_FLIGHT');
    expect((await venueRow()).promptpay_id).toBe(MOBILE);
    expect(await auditRows()).toHaveLength(1);

    await request(app.getHttpServer())
      .post(`/api/payments/${pending.body.data.parts[0].id}/mark-paid`)
      .set(auth())
      .send({ via: 'cash' })
      .expect(200);
    const saved = await patch(OTHER_MOBILE, 'mobile').expect(200);
    expect(saved.body.data.promptpayIdMasked).toBe('XXX-XXX-9999');
    expect((await venueRow()).promptpay_id).toBe(OTHER_MOBILE);
    expect(await auditRows()).toHaveLength(2);
  });

  describe('race', () => {
    it('never leaves a pending QR on the old id after the change succeeds', async () => {
      const seats = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'C1', 'C2'];
      for (const label of seats) {
        await dataSource.query(
          `UPDATE venue SET promptpay_id = $1, promptpay_id_type = 'mobile'`,
          [MOBILE],
        );
        const visitId = await openSeat(label);
        await placeBeer(visitId);
        const [changed, created] = await Promise.all([
          patch(OTHER_MOBILE, 'mobile'),
          request(app.getHttpServer())
            .post(`/api/visits/${visitId}/payments`)
            .set(auth())
            .send({ method: 'promptpay', mode: 'merge' }),
        ]);
        expect(created.status).toBe(201);
        const qr = created.body.data.parts[0].qrPayload as string;
        if (changed.status === 409) {
          expect(changed.body.code).toBe('PAYMENT_IN_FLIGHT');
          expect(qr).toContain('0066812345678');
        } else {
          expect(changed.status).toBe(200);
          expect(qr).toContain('0066899999999');
        }
        expect(changed.status === 200 && qr.includes('0066812345678')).toBe(false);
        await request(app.getHttpServer())
          .post(`/api/payments/${created.body.data.parts[0].id}/cancel`)
          .set(auth())
          .expect(200);
      }
    });
  });

  it('puts the new id into the next PromptPay QR', async () => {
    await patch(MOBILE_DASHED, 'mobile').expect(200);
    const visitId = await openSeat('T1');
    await priceAt(await placeBeer(visitId), '1.23');
    const created = await pay(visitId);
    expect(created.body.data.parts[0].qrPayload).toBe(QR_FOR_ONE_BAHT);
  });

  describe('seed', () => {
    it('keeps an edited id and edited settings on re-run', async () => {
      await dataSource.query(
        `UPDATE venue
         SET name = 'Edited', kitchen_display_enabled = true,
             business_day_cutoff = '05:00', counter_qr_enabled = true,
             payment_mode = 'gateway', promptpay_id = $1, promptpay_id_type = 'mobile'`,
        [OTHER_MOBILE],
      );
      await seedVenue(dataSource);
      const rows: Array<Record<string, unknown>> = await dataSource.query(
        `SELECT name, kitchen_display_enabled, business_day_cutoff::text AS cutoff,
                counter_qr_enabled, payment_mode, promptpay_id
         FROM venue`,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        name: 'Edited',
        kitchen_display_enabled: true,
        cutoff: '05:00:00',
        counter_qr_enabled: true,
        payment_mode: 'gateway',
        promptpay_id: OTHER_MOBILE,
      });
    });
  });

  function auth(): { Authorization: string } {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function settings(): request.Test {
    return request(app.getHttpServer()).get('/api/venue/payment-settings').set(auth());
  }

  function patch(promptpayId: string, promptpayIdType: string): request.Test {
    return request(app.getHttpServer())
      .patch('/api/venue/payment-settings')
      .set(auth())
      .send({ promptpayId, promptpayIdType });
  }

  async function expectRejected(promptpayId: string, promptpayIdType: string): Promise<void> {
    const response = await patch(promptpayId, promptpayIdType);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body)).not.toContain(promptpayId);
  }

  async function venueRow(): Promise<{ promptpay_id: string | null; promptpay_id_type: string | null }> {
    const rows: Array<{ promptpay_id: string | null; promptpay_id_type: string | null }> =
      await dataSource.query(`SELECT id, promptpay_id, promptpay_id_type FROM venue`);
    const row = rows[0];
    if (!row) throw new Error('venue missing');
    return row;
  }

  async function auditRows(): Promise<AuditRow[]> {
    const venue = await dataSource.query(`SELECT id FROM venue`);
    return dataSource.query(
      `SELECT entity, action, changed_fields, changed_by
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

  async function placeBeer(visitId: string): Promise<string> {
    const variants: Array<{ id: string }> = await dataSource.query(
      `SELECT v.id FROM menu_item_variant v
       JOIN menu_item i ON i.id = v.menu_item_id
       WHERE i.name = 'ช้างดราฟต์' AND v.name = 'ปกติ'`,
    );
    const response = await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/orders`)
      .set(auth())
      .send({ items: [{ variantId: variants[0]?.id, quantity: 1 }] })
      .expect(201);
    return response.body.data.id as string;
  }

  async function priceAt(orderId: string, amount: string): Promise<void> {
    await dataSource.query(
      `UPDATE order_item SET unit_price_snapshot = $2
       WHERE ticket_id IN (SELECT id FROM order_ticket WHERE order_id = $1)`,
      [orderId, amount],
    );
  }

  async function pay(visitId: string): Promise<request.Response> {
    return request(app.getHttpServer())
      .post(`/api/visits/${visitId}/payments`)
      .set(auth())
      .send({ method: 'promptpay', mode: 'merge' })
      .expect(201);
  }
});

interface AuditRow {
  entity: string;
  action: string;
  changed_fields: unknown;
  changed_by: string | null;
}

function captureOutput(): { text: () => string; stop: () => void } {
  const lines: string[] = [];
  const stdout = process.stdout.write.bind(process.stdout);
  const stderr = process.stderr.write.bind(process.stderr);
  process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
    lines.push(String(chunk));
    return stdout(chunk, ...(rest as never[]));
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
    lines.push(String(chunk));
    return stderr(chunk, ...(rest as never[]));
  }) as typeof process.stderr.write;
  return {
    text: () => lines.join(''),
    stop: () => {
      process.stdout.write = stdout;
      process.stderr.write = stderr;
    },
  };
}
