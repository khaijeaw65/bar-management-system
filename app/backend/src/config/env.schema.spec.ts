import { parseEnv } from './env.schema.js';

describe('parseEnv', () => {
  it('names PGHOST when it is missing', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'local',
        PGPORT: '5432',
        PGUSER: 'bar',
        PGPASSWORD: 'bar',
        PGDATABASE: 'bar',
      }),
    ).toThrow(/PGHOST/);
  });
});
