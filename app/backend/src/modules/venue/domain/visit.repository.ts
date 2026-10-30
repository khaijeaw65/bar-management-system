import type { InsertVisitResult, NewVisit, VisitRecord } from './visit.types.js';

export interface VisitRepository {
  insert(input: NewVisit): Promise<InsertVisitResult>;
  findById(id: string): Promise<VisitRecord | null>;
  findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null>;
  closeIfLive(id: string): Promise<VisitRecord | null>;
  lockById(id: string): Promise<VisitRecord | null>;
  activateIfWaiting(id: string): Promise<VisitRecord | null>;
  /**
   * Guest's first order (BRIEF-048): open a `qr` visit on the seat, or return the one that is already live.
   * Must run inside the order transaction — a unique-violation would abort it, so this never throws on a race.
   */
  openForGuest(tableSeatId: string): Promise<{ id: string; created: boolean } | null>;
}

export const VISIT_REPOSITORY = Symbol('VISIT_REPOSITORY');
