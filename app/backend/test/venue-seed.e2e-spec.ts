import './set-auth-env.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { seedVenue } from '../src/cli/seed-venue.js';
import { clearStaffAndVenue } from './staff-session.js';

describe('seed:venue (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
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
    await clearStaffAndVenue(dataSource);
  });

  it('seeds 14 unique seats and does not duplicate them', async () => {
    await seedVenue(dataSource);
    await seedVenue(dataSource);

    const rows: Array<{ label: string; kind: string; qr_token: string | null }> =
      await dataSource.query(
        `SELECT label, kind, qr_token FROM table_seat ORDER BY kind, label`,
      );
    expect(rows).toHaveLength(14);
    const tokens = rows.map((row) => row.qr_token);
    expect(tokens.every((token) => typeof token === 'string' && token.length > 0)).toBe(
      true,
    );
    expect(new Set(tokens).size).toBe(14);
    expect(rows.filter((row) => row.kind === 'counter').map((row) => row.label)).toEqual([
      'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
    ]);
    expect(rows.filter((row) => row.kind === 'table').map((row) => row.label)).toEqual([
      'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
    ]);
  });
});
