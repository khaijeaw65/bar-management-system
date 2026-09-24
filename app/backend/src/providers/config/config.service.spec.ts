import type { ConfigService } from '@nestjs/config';
import { databaseOptions, AppConfigService } from './config.service.js';
import { parseEnv } from './config.schema.js';

const env = parseEnv({
  NODE_ENV: 'test',
  PGHOST: 'localhost',
  PGPORT: '5432',
  PGUSER: 'bar',
  PGPASSWORD: 'bar',
  PGDATABASE: 'bar',
});

describe('database config', () => {
  it('keeps synchronize off for Nest and the shared options', () => {
    const config = {
      getOrThrow: (key: keyof typeof env) => env[key],
    } as ConfigService;
    const service = new AppConfigService(config);

    expect(service.database.synchronize).toBe(false);
    expect(databaseOptions(env).synchronize).toBe(false);
    expect(databaseOptions(env).migrationsRun).toBe(false);
  });
});
