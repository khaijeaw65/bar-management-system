import type { InsertVisitResult, NewVisit, VisitRecord } from './visit.types.js';

export interface VisitRepository {
  insert(input: NewVisit): Promise<InsertVisitResult>;
  findById(id: string): Promise<VisitRecord | null>;
  findLiveBySeat(tableSeatId: string): Promise<VisitRecord | null>;
  closeIfLive(id: string): Promise<VisitRecord | null>;
}

export const VISIT_REPOSITORY = Symbol('VISIT_REPOSITORY');
