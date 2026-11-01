import {
  DemoLoginRequestSchema,
  DemoLoginRoleSchema,
  MobileRefreshRequestSchema,
  MobileTokenRequestSchema,
  MobileTokenResponseSchema,
} from './auth.js';

const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

describe('MobileTokenRequestSchema', () => {
  it('accepts an RFC 7636 verifier and a one-time code', () => {
    expect(
      MobileTokenRequestSchema.parse({ code: 'abc', codeVerifier: VERIFIER }),
    ).toEqual({ code: 'abc', codeVerifier: VERIFIER });
  });

  it('rejects a verifier outside the RFC 7636 length', () => {
    const parsed = MobileTokenRequestSchema.safeParse({
      code: 'abc',
      codeVerifier: 'short',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('MobileRefreshRequestSchema', () => {
  it('requires a refresh token', () => {
    expect(MobileRefreshRequestSchema.safeParse({}).success).toBe(false);
    expect(MobileRefreshRequestSchema.parse({ refreshToken: 'raw' })).toEqual({
      refreshToken: 'raw',
    });
  });
});

describe('MobileTokenResponseSchema', () => {
  it('requires the bearer pair and the access TTL', () => {
    expect(
      MobileTokenResponseSchema.parse({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
      }),
    ).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresIn: 900,
    });
  });
});

describe('DemoLoginRoleSchema', () => {
  it('accepts valid demo roles', () => {
    expect(DemoLoginRoleSchema.parse('owner')).toBe('owner');
    expect(DemoLoginRoleSchema.parse('manager')).toBe('manager');
    expect(DemoLoginRoleSchema.parse('staff')).toBe('staff');
  });

  it('rejects invalid demo role', () => {
    expect(DemoLoginRoleSchema.safeParse('admin').success).toBe(false);
  });
});

describe('DemoLoginRequestSchema', () => {
  it('validates role object', () => {
    expect(DemoLoginRequestSchema.parse({ role: 'owner' })).toEqual({
      role: 'owner',
    });
  });

  it('rejects missing role', () => {
    expect(DemoLoginRequestSchema.safeParse({}).success).toBe(false);
  });
});
