import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEV_DATABASE = 'bar';
const DEV_ENV_FILE = fileURLToPath(new URL('../.env', import.meta.url));

/**
 * e2e clears whole tables, so it gets its own database (BRIEF-036 Rev 2).
 * `PGDATABASE` is ignored on purpose: CI and the dev `.env` both set it to `bar`.
 */
export function testDatabaseName(): string {
  const name = process.env.PGDATABASE_TEST ?? 'bar_test';
  assertNotDevDatabase(name);
  return name;
}

function assertNotDevDatabase(name: string): void {
  const devNames = [DEV_DATABASE, devEnvDatabase()].filter(Boolean);
  if (!devNames.includes(name)) return;
  throw new Error(
    `e2e refused to run against "${name}" — that is the dev database and the tests delete its rows. ` +
      'Unset PGDATABASE_TEST or point it at a throwaway database (default bar_test).',
  );
}

function devEnvDatabase(): string | undefined {
  if (!existsSync(DEV_ENV_FILE)) return undefined;
  const line = readFileSync(DEV_ENV_FILE, 'utf8')
    .split('\n')
    .find((entry) => entry.trim().startsWith('PGDATABASE='));
  return line?.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
}
