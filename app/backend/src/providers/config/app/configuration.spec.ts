import { appConfiguration } from './configuration.js';

describe('appConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names FRONTEND_URL when it is missing', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('PORT', '3001');
    vi.stubEnv('FRONTEND_URL', '');

    expect(() => appConfiguration()).toThrow(/FRONTEND_URL/);
  });

  it('defaults PORT to 3011 when it is not set', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('PORT', '');
    vi.stubEnv('FRONTEND_URL', 'http://localhost:3010');

    expect(appConfiguration().port).toBe(3011);
  });
});
