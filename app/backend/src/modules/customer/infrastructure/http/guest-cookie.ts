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

/** The guest cookie out of a raw `Cookie` header (the socket handshake has no cookie-parser). */
export function guestCookieFromHeader(header: string | undefined): string | undefined {
  const prefix = `${GUEST_COOKIE}=`;
  const pair = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  const value = pair?.slice(prefix.length);
  return value ? decodeURIComponent(value) : undefined;
}
