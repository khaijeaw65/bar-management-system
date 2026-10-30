import type { TableSeatKind, VisitState } from '@bar/contracts';

export interface NewGuestSession {
  tokenHash: string;
  tableSeatId: string;
  visitId: string | null;
  expiresAt: Date;
}

/** A session joined with its seat and bound visit — everything the guard decides on. */
export interface GuestSessionRow {
  id: string;
  seat: { id: string; label: string; kind: TableSeatKind; isActive: boolean };
  visitId: string | null;
  visitState: VisitState | null;
  displayName: string | null;
  expiresAt: Date;
  createdAt: Date;
}

/** What `request.guestSession` carries once the guard has accepted the cookie. */
export interface GuestSessionView {
  id: string;
  seat: { id: string; label: string; kind: TableSeatKind };
  visitId: string | null;
  displayName: string | null;
  expiresAt: Date;
  /** Set on the request that bound a seat-only session to the seat's live visit (bind on read). */
  justBound?: true;
}

export interface StartedGuestSession {
  session: GuestSessionView;
  /** Raw cookie value, only when a new session was created. */
  token: string | null;
}
