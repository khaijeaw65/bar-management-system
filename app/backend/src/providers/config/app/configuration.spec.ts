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
});
