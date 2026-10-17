import type { IncomingMessage } from 'node:http';
import type { OriginDecision } from './notifications.types.js';

export function allowStaffOrigin(
  request: IncomingMessage,
  frontendUrl: string,
  callback: OriginDecision,
): void {
  const origin = headerOrigin(request.headers.origin);
  if (origin === undefined || origin === frontendUrl) {
    callback(undefined, true);
    return;
  }
  callback('origin not allowed', false);
}

function headerOrigin(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
