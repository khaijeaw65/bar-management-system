import type { StaffOpenVia, VisitOpenSource, VisitState } from '@bar/contracts';

export interface NewVisit {
  tableSeatId: string;
  guestLabel: string | null;
  staffId: string;
  via: StaffOpenVia;
}

export interface VisitRecord {
  id: string;
  tableSeatId: string;
  state: VisitState;
  openedAt: Date;
  closedAt: Date | null;
  guestLabel: string | null;
  openedBy: string | null;
  openedVia: VisitOpenSource;
}

export type InsertVisitResult =
  | { kind: 'created'; visit: VisitRecord }
  | { kind: 'taken' };
