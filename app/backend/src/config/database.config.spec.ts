import { buildDatabaseOptions, databaseConfig } from './database.config.js';
import { validateEnv } from './env.schema.js';

describe('database config', () => {
  it('keeps synchronize off in Nest config and the CLI data source', async () => {
    const env = validateEnv({
      NODE_ENV: 'test',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGUSER: 'bar',
      PGPASSWORD: 'bar',
      PGDATABASE: 'bar',
    });

    expect(databaseConfig().synchronize).toBe(false);
    expect(buildDatabaseOptions(env).synchronize).toBe(false);

    const { AppDataSource } = await import('../database/data-source.js');
    expect(AppDataSource.options.synchronize).toBe(false);
  });
});
