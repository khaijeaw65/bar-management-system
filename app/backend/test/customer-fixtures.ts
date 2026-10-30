import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';

export interface SeatRow {
  id: string;
  qr: string;
}

export async function seatByLabel(dataSource: DataSource, label: string): Promise<SeatRow> {
  const rows: Array<{ id: string; qr_token: string }> = await dataSource.query(
    `SELECT id, qr_token FROM table_seat WHERE label = $1`,
    [label],
  );
  const row = rows[0];
  if (!row) throw new Error(`seat ${label} missing`);
  return { id: row.id, qr: row.qr_token };
}

export async function variantByName(dataSource: DataSource, name: string): Promise<{ itemId: string; variantId: string }> {
  const rows: Array<{ itemId: string; variantId: string }> = await dataSource.query(
    `SELECT i.id AS "itemId", v.id AS "variantId"
     FROM menu_item i JOIN menu_item_variant v ON v.menu_item_id = i.id
     WHERE i.name = $1 AND v.name = 'ปกติ' LIMIT 1`,
    [name],
  );
  const row = rows[0];
  if (!row) throw new Error(`${name} missing`);
  return row;
}

/** Scans a QR and returns the raw cookie value of the new guest session. */
export async function startGuest(app: INestApplication, qrToken: string): Promise<string> {
  const response = await request(app.getHttpServer()).post('/api/customer/sessions').send({ qrToken }).expect(201);
  const cookie = /guest_session=([^;]+)/.exec(String(response.headers['set-cookie']))?.[1];
  if (!cookie) throw new Error('no guest cookie');
  return cookie;
}

export function asGuest(app: INestApplication, method: 'get' | 'post' | 'patch', path: string, cookie: string) {
  return request(app.getHttpServer())[method](`/api/customer${path}`).set('Cookie', `guest_session=${cookie}`);
}

export function openVisit(app: INestApplication, accessToken: string, tableSeatId: string) {
  return request(app.getHttpServer())
    .post('/api/visits')
    .set({ Authorization: `Bearer ${accessToken}` })
    .send({ tableSeatId });
}

export async function waitFor(check: () => boolean, label: string, ms = 3_000): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`timed out waiting for ${label}`);
}
