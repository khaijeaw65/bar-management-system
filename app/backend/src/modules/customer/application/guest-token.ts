import { createHash, randomBytes } from 'node:crypto';

export function newGuestToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashGuestToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
