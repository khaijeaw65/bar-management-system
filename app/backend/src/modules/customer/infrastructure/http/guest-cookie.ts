import type { CookieOptions } from 'express';

export const GUEST_COOKIE = 'guest_session';

/** No maxAge: a session cookie, the server owns expiry (DR-028). */
export function guestCookieOptions(nodeEnv: string): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: nodeEnv === 'production',
    path: '/api/customer',
  };
}
