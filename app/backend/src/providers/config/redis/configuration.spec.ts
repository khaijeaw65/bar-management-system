import { redisConfiguration } from './configuration.js';

describe('redisConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names REDIS_URL when it is missing', () => {
    vi.stubEnv('REDIS_URL', '');

    expect(() => redisConfiguration()).toThrow(/REDIS_URL/);
  });

  it('returns the redis url', () => {
    vi.stubEnv('REDIS_URL', 'redis://localhost:6379');

    expect(redisConfiguration()).toEqual({ url: 'redis://localhost:6379' });
  });
});
