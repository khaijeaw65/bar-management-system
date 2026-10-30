import type { StaffOpenVia, TableSeatKind } from '@bar/contracts';
import type { VisitRecord } from '../domain/visit.types.js';

export interface OpenVisitInput {
  tableSeatId: string;
  guestLabel: string | null;
  via: StaffOpenVia;
  staffId: string;
}

export interface VisitOpenerView {
  staffId: string;
  displayName: string;
}

export interface VisitView extends VisitRecord {
  seatLabel: string;
  seatKind: TableSeatKind;
  opener: VisitOpenerView | null;
}

export interface OpenVisitResult {
  visit: VisitView;
  attached: boolean;
}

export interface OrderClaim {
  activated: boolean;
  visitId: string;
  tableSeatId: string;
}

export interface GuestVisit {
  visitId: string;
  tableSeatId: string;
  created: boolean;
}
