import { jwtConfiguration } from './configuration.js';

const SECRET = 'x'.repeat(32);

describe('jwtConfiguration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names JWT_ACCESS_SECRET when it is missing', () => {
    vi.stubEnv('JWT_ACCESS_SECRET', '');
    vi.stubEnv('JWT_ACCESS_TTL', '');
    vi.stubEnv('REFRESH_TTL_DAYS', '');
    vi.stubEnv('MOBILE_REFRESH_TTL_DAYS', '');

    expect(() => jwtConfiguration()).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('names JWT_ACCESS_SECRET when it is shorter than 32 characters', () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'x'.repeat(31));
    vi.stubEnv('JWT_ACCESS_TTL', '');
    vi.stubEnv('REFRESH_TTL_DAYS', '');
    vi.stubEnv('MOBILE_REFRESH_TTL_DAYS', '');

    expect(() => jwtConfiguration()).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('defaults the access TTL to 15 minutes and refresh TTL to 7 days', () => {
    vi.stubEnv('JWT_ACCESS_SECRET', SECRET);
    vi.stubEnv('JWT_ACCESS_TTL', '');
    vi.stubEnv('REFRESH_TTL_DAYS', '');
    vi.stubEnv('MOBILE_REFRESH_TTL_DAYS', '');

    expect(jwtConfiguration()).toMatchObject({
      accessSecret: SECRET,
      accessTtl: '15m',
      accessTtlSeconds: 900,
      refreshTtlDays: 7,
      refreshTtlSeconds: 604_800,
      mobileRefreshTtlDays: 30,
      mobileRefreshTtlSeconds: 2_592_000,
    });
  });
});
