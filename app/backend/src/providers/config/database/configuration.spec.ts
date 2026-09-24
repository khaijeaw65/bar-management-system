import { databaseConfiguration } from './configuration.js';

describe('databaseConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names PGHOST when it is missing', () => {
    vi.stubEnv('PGHOST', '');
    vi.stubEnv('PGPORT', '5432');
    vi.stubEnv('PGUSER', 'bar');
    vi.stubEnv('PGPASSWORD', 'bar');
    vi.stubEnv('PGDATABASE', 'bar');

    expect(() => databaseConfiguration()).toThrow(/PGHOST/);
  });
});
