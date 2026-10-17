import type { Socket } from 'socket.io';

export function tokenFromHandshake(socket: Socket): string | undefined {
  const cookie = cookieValue(socket.handshake.headers.cookie, 'access_token');
  if (cookie) return cookie;
  const fromAuth = authToken(socket.handshake.auth.token);
  if (fromAuth) return fromAuth;
  return bearerToken(socket.handshake.headers.authorization);
}

function cookieValue(
  header: string | string[] | undefined,
  name: string,
): string | undefined {
  const raw = Array.isArray(header) ? header.join(';') : header;
  if (!raw) return undefined;
  const pair = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!pair) return undefined;
  const value = pair.slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}

function authToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const token = value.trim();
  return token || undefined;
}

function bearerToken(header: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw?.startsWith('Bearer ')) return undefined;
  const token = raw.slice('Bearer '.length).trim();
  return token || undefined;
}
