import { testDatabaseName } from './test-database.js';

export function applyTestEnv(): void {
  process.env.NODE_ENV ??= 'test';
  process.env.PORT ??= '3001';
  process.env.PGHOST ??= 'localhost';
  process.env.PGPORT ??= '5432';
  process.env.PGUSER ??= 'bar';
  process.env.PGPASSWORD ??= 'bar';
  // Forced, not defaulted — see testDatabaseName().
  process.env.PGDATABASE = testDatabaseName();
  process.env.REDIS_URL ??= 'redis://127.0.0.1:6379';
  process.env.JWT_ACCESS_SECRET ??= 'test-jwt-access-secret-32-characters';
  process.env.JWT_ACCESS_TTL ??= '15m';
  process.env.REFRESH_TTL_DAYS ??= '7';
  process.env.LINE_CHANNEL_ID ??= 'line-channel-test';
  process.env.LINE_CHANNEL_SECRET ??= 'line-channel-secret-test';
  process.env.LINE_CALLBACK_URL ??= 'http://localhost:3001/api/auth/line/callback';
  process.env.FRONTEND_URL ??= 'http://localhost:3000';
  process.env.AWS_REGION ??= 'ap-southeast-1';
  process.env.S3_BUCKET ??= 'bar-test';
  // Forced empty (BRIEF-039 AC-6): the suite runs with no AWS keys; photo tests swap in FakeStorage.
  process.env.AWS_ACCESS_KEY_ID = '';
  process.env.AWS_SECRET_ACCESS_KEY = '';
}

applyTestEnv();
