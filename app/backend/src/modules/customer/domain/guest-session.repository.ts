import type { GuestSessionRow, NewGuestSession } from './guest-session.types.js';

export abstract class GuestSessionRepository {
  /** Returns the new session id. */
  public abstract insert(input: NewGuestSession): Promise<string>;
  public abstract findByTokenHash(tokenHash: string): Promise<GuestSessionRow | null>;
  public abstract setExpiresAt(id: string, expiresAt: Date): Promise<void>;
  /** Inside the order transaction: bind a seat-only session to the visit its first order opened or joined. */
  public abstract bindVisit(id: string, visitId: string): Promise<void>;
  public abstract setDisplayName(id: string, displayName: string | null): Promise<void>;
  /** Seat-only rows that expired before `before`, at most `limit`. Returns how many were deleted. */
  public abstract purgeExpired(before: Date, limit: number): Promise<number>;
}
