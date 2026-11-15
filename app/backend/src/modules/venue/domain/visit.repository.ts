import type { InsertVisitResult, NewVisit, VisitRecord } from './visit.types.js';

export abstract class VisitRepository {
  public abstract insert(input: NewVisit): Promise<InsertVisitResult>;
  public abstract findById(id: string): Promise<VisitRecord | null>;
  public abstract findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null>;
  public abstract closeIfLive(id: string): Promise<VisitRecord | null>;
  public abstract lockById(id: string): Promise<VisitRecord | null>;
  public abstract activateIfWaiting(id: string): Promise<VisitRecord | null>;
  /**
   * Guest's first order (BRIEF-048): open a `qr` visit on the seat, or return the one that is already live.
   * Must run inside the order transaction — a unique-violation would abort it, so this never throws on a race.
   */
  public abstract openForGuest(tableSeatId: string): Promise<{ id: string; created: boolean } | null>;
}
