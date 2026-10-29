import type { CustomerSession } from '@bar/contracts';
import type { GuestSessionView } from '../domain/guest-session.types.js';

export function toCustomerSession(session: GuestSessionView): CustomerSession {
  return {
    seat: session.seat,
    visitId: session.visitId,
    displayName: session.displayName,
    expiresAt: session.expiresAt.toISOString(),
  };
}
