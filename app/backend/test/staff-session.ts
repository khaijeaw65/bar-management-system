import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { IssuedSession } from '../src/modules/auth/application/token.types.js';
import { TokenService } from '../src/modules/auth/application/token.service.js';

export async function insertStaff(
  dataSource: DataSource,
  displayName: string,
): Promise<string> {
  const inserted: Array<{ id: string }> = await dataSource.query(
    `INSERT INTO staff_user (display_name) VALUES ($1) RETURNING id`,
    [displayName],
  );
  const id = inserted[0]?.id;
  if (!id) throw new Error('staff insert failed');
  return id;
}

export function staffSession(
  app: INestApplication,
  staffId: string,
): Promise<IssuedSession> {
  return app.get(TokenService).createSession(staffId);
}

export async function clearStaffAndVenue(dataSource: DataSource): Promise<void> {
  await dataSource.query('DELETE FROM visit');
  await dataSource.query('DELETE FROM table_seat');
  await dataSource.query('DELETE FROM staff_access_request');
  await dataSource.query('DELETE FROM staff_user_identity');
  await dataSource.query('DELETE FROM staff_user');
}

export function httpPort(app: INestApplication): number {
  const address = app.getHttpServer().address() as { port?: number } | null;
  if (!address?.port) throw new Error('app is not listening');
  return address.port;
}
