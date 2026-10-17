import type { CookieOptions, Response } from 'express';

const BASE: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

export function accessCookieOptions(
  nodeEnv: string,
  maxAgeSeconds: number,
): CookieOptions {
  return {
    ...BASE,
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
  nodeEnv: string,
  accessTtlSeconds: number,
  refreshTtlSeconds: number,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(
    'access_token',
    accessToken,
    accessCookieOptions(nodeEnv, accessTtlSeconds),
  );
  res.cookie(
    'refresh_token',
    refreshToken,
    refreshCookieOptions(nodeEnv, refreshTtlSeconds),
  );
}

export function clearSessionCookies(res: Response, nodeEnv: string): void {
  const secure = nodeEnv === 'production';
  res.clearCookie('access_token', { ...BASE, secure, path: '/' });
  res.clearCookie('refresh_token', { ...BASE, secure, path: '/api/auth' });
}
