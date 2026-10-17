import { accessCookieOptions, refreshCookieOptions } from './auth-cookies.js';

describe('session cookies', () => {
  it('sets Secure only in production and keeps the brief paths', () => {
    const access = accessCookieOptions('production', 900);
    const refresh = refreshCookieOptions('test', 604_800);

    expect(access).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 900_000,
    });
    expect(refresh).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/api/auth',
      maxAge: 604_800_000,
    });
  });
});
