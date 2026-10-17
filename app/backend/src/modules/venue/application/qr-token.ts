import { randomBytes } from 'node:crypto';

export function newQrToken(): string {
  return randomBytes(32).toString('base64url');
}
