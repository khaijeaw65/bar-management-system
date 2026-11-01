import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { clearStaffAndVenue, insertStaff, staffSession } from './staff-session.js';

function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('Staff PIN management (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
  });

  it('AC-8: sets PIN for the first time without currentPin, hashes it, and omits hash from response', async () => {
    const staffId = await insertStaff(dataSource, 'Somchai', 'พนักงาน');
    const session = await staffSession(app, staffId);

    const res = await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session.accessToken))
      .send({ pin: '1234' })
      .expect(200);

    expect(res.body.data).toEqual({ ok: true });
    expect(res.body.data.posPinHash).toBeUndefined();
    expect(res.body.data.pos_pin_hash).toBeUndefined();

    // Verify hash is saved in DB
    const rows: Array<{ pos_pin_hash: string | null }> = await dataSource.query(
      `SELECT pos_pin_hash FROM staff_user WHERE id = $1`,
      [staffId],
    );
    expect(rows[0]?.pos_pin_hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);

    // Verify GET /api/me/permissions shows permissions and never reveals the hash
    const meRes = await request(app.getHttpServer())
      .get('/api/me/permissions')
      .set(bearer(session.accessToken))
      .expect(200);

    expect(meRes.body.data.posPinHash).toBeUndefined();
    expect(meRes.body.data.pos_pin_hash).toBeUndefined();
  });

  it('AC-8: updating PIN requires correct currentPin', async () => {
    const staffId = await insertStaff(dataSource, 'Somchai', 'พนักงาน');
    const session = await staffSession(app, staffId);

    // Initial PIN set
    await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session.accessToken))
      .send({ pin: '1234' })
      .expect(200);

    // Missing currentPin
    const missingRes = await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session.accessToken))
      .send({ pin: '5678' })
      .expect(422);

    expect(missingRes.body.code).toBe('PIN_INVALID');

    // Wrong currentPin
    const wrongRes = await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session.accessToken))
      .send({ pin: '5678', currentPin: '9999' })
      .expect(422);

    expect(wrongRes.body.code).toBe('PIN_INVALID');

    // Correct currentPin
    const okRes = await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session.accessToken))
      .send({ pin: '5678', currentPin: '1234' })
      .expect(200);

    expect(okRes.body.data).toEqual({ ok: true });
  });

  it('AC-8: rejects duplicate PIN among active staff with 409 PIN_UNAVAILABLE', async () => {
    const staff1 = await insertStaff(dataSource, 'Staff 1', 'พนักงาน');
    const staff2 = await insertStaff(dataSource, 'Staff 2', 'พนักงาน');
    const session1 = await staffSession(app, staff1);
    const session2 = await staffSession(app, staff2);

    // Staff 1 sets 1234
    await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session1.accessToken))
      .send({ pin: '1234' })
      .expect(200);

    // Staff 2 tries to set 1234 -> 409
    const dupRes = await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session2.accessToken))
      .send({ pin: '1234' })
      .expect(409);

    expect(dupRes.body.code).toBe('PIN_UNAVAILABLE');

    // Deactivate Staff 1
    await dataSource.query(`UPDATE staff_user SET is_active = false WHERE id = $1`, [staff1]);

    // Now Staff 2 can use 1234
    await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(session2.accessToken))
      .send({ pin: '1234' })
      .expect(200);
  });

  it('AC-8: owner can reset staff PIN via DELETE /api/staff/:id/pin; writes audit log', async () => {
    const ownerId = await insertStaff(dataSource, 'Owner', 'เจ้าของ');
    const staffId = await insertStaff(dataSource, 'Staff', 'พนักงาน');
    const ownerSession = await staffSession(app, ownerId);
    const staffSessionToken = await staffSession(app, staffId);

    // Staff sets PIN
    await request(app.getHttpServer())
      .put('/api/me/pin')
      .set(bearer(staffSessionToken.accessToken))
      .send({ pin: '1234' })
      .expect(200);

    // Staff without staff:manage tries to reset
    await request(app.getHttpServer())
      .delete(`/api/staff/${staffId}/pin`)
      .set(bearer(staffSessionToken.accessToken))
      .expect(403);

    // Owner resets PIN
    await request(app.getHttpServer())
      .delete(`/api/staff/${staffId}/pin`)
      .set(bearer(ownerSession.accessToken))
      .expect(204);

    // Verify DB pos_pin_hash is null
    const rows: Array<{ pos_pin_hash: string | null }> = await dataSource.query(
      `SELECT pos_pin_hash FROM staff_user WHERE id = $1`,
      [staffId],
    );
    expect(rows[0]?.pos_pin_hash).toBeNull();

    // Verify audit log has posPinHash REDACTED -> null
    const auditRows: Array<{ entity: string; entity_id: string; changed_fields: Record<string, unknown> }> =
      await dataSource.query(
        `SELECT entity, entity_id, changed_fields FROM audit_log WHERE entity = 'staff_user' AND entity_id = $1`,
        [staffId],
      );
    expect(auditRows.length).toBeGreaterThan(0);
    expect(auditRows[0]?.changed_fields).toEqual({
      posPinHash: { from: 'REDACTED', to: null },
    });
  });
});
