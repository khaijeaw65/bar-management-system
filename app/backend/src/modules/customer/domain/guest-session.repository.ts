import type { GuestSessionRow, NewGuestSession } from './guest-session.types.js';

export interface GuestSessionRepository {
  /** Returns the new session id. */
  insert(input: NewGuestSession): Promise<string>;
  findByTokenHash(tokenHash: string): Promise<GuestSessionRow | null>;
  setExpiresAt(id: string, expiresAt: Date): Promise<void>;
  /** Inside the order transaction: bind a seat-only session to the visit its first order opened or joined. */
  bindVisit(id: string, visitId: string): Promise<void>;
  setDisplayName(id: string, displayName: string | null): Promise<void>;
  /** Seat-only rows that expired before `before`, at most `limit`. Returns how many were deleted. */
  purgeExpired(before: Date, limit: number): Promise<number>;
}

export const GUEST_SESSION_REPOSITORY = Symbol('GUEST_SESSION_REPOSITORY');
