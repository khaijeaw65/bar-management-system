import './set-auth-env.js';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TableStaffCallClearedPayloadSchema } from '@bar/contracts';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedMenu } from '../src/cli/seed-menu-catalog.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { RedisService } from '../src/providers/redis/redis.service.js';
import { asGuest, openVisit, seatByLabel, startGuest, variantByName, waitFor } from './customer-fixtures.js';
import { clearStaffAndVenue, httpPort, insertStaff, staffSession } from './staff-session.js';

describe('Staff call acknowledgement (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let staffId: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.listen(0, '127.0.0.1');
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    await app.get(RedisService).client.flushdb();
  });

  afterAll(async () => {
    for (const socket of sockets) socket.close();
    await clearStaffAndVenue(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await clearStaffAndVenue(dataSource);
    await app.get(RedisService).client.flushdb();
    staffId = await insertStaff(dataSource, 'คนเก่า');
    accessToken = (await staffSession(app, staffId)).accessToken;
    await seedVenue(dataSource);
    await seedMenu(dataSource);
  });

  it('records who cleared a bell and says so once (AC-1, AC-2)', async () => {
    const seat = await seatByLabel(dataSource, 'T1');
    const guest = await startGuest(app, seat.qr);
    await asGuest(app, 'post', '/call-staff', guest).send({ reason: 'bill', note: 'เช็คบิลค่ะ' }).expect(201);
    const bell = await bellOf(seat.id);
    await dataSource.query(`UPDATE staff_user SET display_name = $2 WHERE id = $1`, [staffId, 'คนใหม่']);
    const events = await staffEvents();

    await acknowledge(accessToken, seat.id).expect(200);
    await acknowledge(accessToken, seat.id).expect(200);

    const cleared = await clearedPayloads(events);
    expect(cleared).toEqual([
      { tableSeatId: seat.id, acknowledgedBy: { staffId, displayName: 'คนใหม่' } },
    ]);
    const audits = await seatAudits(seat.id);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      entity: 'table_seat',
      action: 'UPDATE',
      changed_by: staffId,
      changed_fields: {
        staffCalledAt: { from: bell.calledAt, to: null },
        staffCallReason: { from: 'bill', to: null },
      },
    });
    expect(Object.keys(audits[0]?.changed_fields ?? {}).sort()).toEqual(['staffCallReason', 'staffCalledAt']);
  });

  it('answers 200 and writes nothing when the seat has no bell (AC-3)', async () => {
    const seat = await seatByLabel(dataSource, 'T3');
    const events = await staffEvents();

    await acknowledge(accessToken, seat.id).expect(200);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(clearedNames(events)).toEqual([]);
    expect(await seatAudits(seat.id)).toEqual([]);
  });

  it('clears a transfer bell and a closed visit without an acknowledger or an audit row (AC-4)', async () => {
    await dataSource.query(`UPDATE venue SET promptpay_id = '0812345678', promptpay_id_type = 'mobile'`);
    const transferSeat = await seatByLabel(dataSource, 'T1');
    const guest = await startGuest(app, transferSeat.qr);
    const beer = await variantByName(dataSource, 'ช้างดราฟต์');
    await asGuest(app, 'post', '/orders', guest)
      .send({ items: [{ variantId: beer.variantId, quantity: 1 }] })
      .expect(201);
    const paymentId = (await asGuest(app, 'post', '/payments', guest).set('Idempotency-Key', randomUUID()).send({}).expect(201))
      .body.data.id as string;
    await asGuest(app, 'post', `/payments/${paymentId}/notify-transfer`, guest).send({}).expect(200);
    const transferEvents = await staffEvents();
    await request(app.getHttpServer())
      .post(`/api/payments/${paymentId}/mark-paid`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ via: 'manual', reason: 'direct_transfer' })
      .expect(200);
    expect(await clearedPayloads(transferEvents)).toEqual([
      { tableSeatId: transferSeat.id, acknowledgedBy: null },
    ]);
    expect(await seatAudits(transferSeat.id)).toEqual([]);

    const closeSeat = await seatByLabel(dataSource, 'T2');
    const visitId = (await openVisit(app, accessToken, closeSeat.id).expect(201)).body.data.visit.id as string;
    const caller = await startGuest(app, closeSeat.qr);
    await asGuest(app, 'post', '/call-staff', caller).send({ reason: 'other' }).expect(201);
    const closeEvents = await staffEvents();
    await request(app.getHttpServer())
      .post(`/api/visits/${visitId}/close`)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(200);
    expect(await clearedPayloads(closeEvents)).toEqual([
      { tableSeatId: closeSeat.id, acknowledgedBy: null },
    ]);
    expect(await seatAudits(closeSeat.id)).toEqual([]);
  });

  it('lets only one of two simultaneous acks record the bell (AC-5)', async () => {
    const seat = await seatByLabel(dataSource, 'T4');
    const guest = await startGuest(app, seat.qr);
    await asGuest(app, 'post', '/call-staff', guest).send({ reason: 'bill' }).expect(201);
    const otherId = await insertStaff(dataSource, 'บี');
    const otherToken = (await staffSession(app, otherId)).accessToken;
    const events = await staffEvents();

    const [first, second] = await Promise.all([
      acknowledge(accessToken, seat.id),
      acknowledge(otherToken, seat.id),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 200]);
    const cleared = await clearedPayloads(events);
    expect(cleared).toHaveLength(1);
    const winner = cleared[0]?.acknowledgedBy;
    expect([staffId, otherId]).toContain(winner?.staffId);
    expect(winner?.displayName).toBe(winner?.staffId === staffId ? 'คนเก่า' : 'บี');
    const audits = await seatAudits(seat.id);
    expect(audits).toHaveLength(1);
    expect(audits[0]?.changed_by).toBe(winner?.staffId);
  });

  function acknowledge(token: string, seatId: string) {
    return request(app.getHttpServer())
      .post(`/api/tables/${seatId}/acknowledge-call`)
      .set({ Authorization: `Bearer ${token}` });
  }

  async function bellOf(seatId: string): Promise<{ calledAt: string }> {
    const rows: Array<{ staff_called_at: Date | string }> = await dataSource.query(
      `SELECT staff_called_at FROM table_seat WHERE id = $1`,
      [seatId],
    );
    const calledAt = rows[0]?.staff_called_at;
    if (!calledAt) throw new Error('bell missing');
    return { calledAt: new Date(calledAt).toISOString() };
  }

  async function seatAudits(seatId: string): Promise<Array<{
    entity: string;
    action: string;
    changed_by: string | null;
    changed_fields: Record<string, { from: string | null; to: string | null }> | null;
  }>> {
    return dataSource.query(
      `SELECT entity, action, changed_by, changed_fields
       FROM audit_log WHERE entity = 'table_seat' AND entity_id = $1`,
      [seatId],
    );
  }

  async function staffEvents(): Promise<Array<{ name: string; payload: unknown }>> {
    const events: Array<{ name: string; payload: unknown }> = [];
    const socket = await new Promise<Socket>((resolve, reject) => {
      const created = io(`http://127.0.0.1:${httpPort(app)}/staff`, {
        transports: ['websocket'],
        reconnection: false,
        auth: { token: accessToken },
        extraHeaders: { origin: 'http://localhost:3000' },
      });
      created.once('connect', () => resolve(created));
      created.once('connect_error', reject);
    });
    sockets.push(socket);
    socket.onAny((name: string, payload: unknown) => events.push({ name, payload }));
    return events;
  }

  async function clearedPayloads(events: Array<{ name: string; payload: unknown }>) {
    await waitFor(() => clearedNames(events).length > 0, 'table.staff_call_cleared');
    await new Promise((resolve) => setTimeout(resolve, 40));
    return events
      .filter((event) => event.name === 'table.staff_call_cleared')
      .map((event) => TableStaffCallClearedPayloadSchema.parse(event.payload));
  }

  function clearedNames(events: Array<{ name: string }>): string[] {
    return events.filter((event) => event.name === 'table.staff_call_cleared').map((event) => event.name);
  }
});
