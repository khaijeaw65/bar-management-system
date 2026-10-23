import pg from 'pg';
import { DataSource } from 'typeorm';
import { migrations } from '../src/providers/database/migrations.js';
import { applyTestEnv } from './set-auth-env.js';

/** Creates the e2e database when missing and brings it to the latest migration. */
export default async function setup(): Promise<void> {
  applyTestEnv();
  const database = process.env.PGDATABASE ?? '';
  await createDatabaseIfMissing(database);
  await runMigrations(database);
}

function connection(): { host?: string; port: number; user?: string; password?: string } {
  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  };
}

async function createDatabaseIfMissing(database: string): Promise<void> {
  const client = new pg.Client({ ...connection(), database: 'postgres' });
  await client.connect();
  try {
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (found.rowCount) return;
    await client.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
  } finally {
    await client.end();
  }
}

async function runMigrations(database: string): Promise<void> {
  const config = connection();
  const dataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.user,
    password: config.password,
    database,
    migrations,
  });
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}
