import type { CookieOptions, Response } from 'express';
import type { SessionCookies } from './dto/auth.dto.js';

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

export function accessCookieOptions(
  nodeEnv: string,
  maxAgeSeconds: number,
): CookieOptions {
  return {
    ...BASE_COOKIE_OPTIONS,
    secure: nodeEnv === 'production',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

export function refreshCookieOptions(
  nodeEnv: string,
  maxAgeSeconds: number,
): CookieOptions {
  return {
    ...accessCookieOptions(nodeEnv, maxAgeSeconds),
    path: '/api/auth',
  };
}

export function writeSessionCookies(
  res: Response,
  cookies: SessionCookies,
): void {
  res.cookie(
    'access_token',
    cookies.accessToken,
    accessCookieOptions(cookies.nodeEnv, cookies.accessTtlSeconds),
  );
  res.cookie(
    'refresh_token',
    cookies.refreshToken,
    refreshCookieOptions(cookies.nodeEnv, cookies.refreshTtlSeconds),
  );
}

export function clearSessionCookies(res: Response, nodeEnv: string): void {
  const secure = nodeEnv === 'production';
  res.clearCookie('access_token', {
    ...BASE_COOKIE_OPTIONS,
    secure,
    path: '/',
  });
  res.clearCookie('refresh_token', {
    ...BASE_COOKIE_OPTIONS,
    secure,
    path: '/api/auth',
  });
}
