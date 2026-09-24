import { databaseOptions } from './database-options.js';

describe('databaseOptions', () => {
  it('keeps synchronize off', () => {
    const options = databaseOptions({
      host: 'localhost',
      port: 5432,
      username: 'bar',
      password: 'bar',
      database: 'bar',
      nodeEnv: 'test',
    });

    expect(options.synchronize).toBe(false);
    expect(options.migrationsRun).toBe(false);
  });
});
