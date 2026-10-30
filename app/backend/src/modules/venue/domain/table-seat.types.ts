import type { CallStaffReason, TableSeatKind, VisitState } from '@bar/contracts';

export interface SeatIdentity {
  id: string;
  label: string;
  kind: TableSeatKind;
  sortOrder: number;
}

export interface LiveVisitCard {
  id: string;
  state: VisitState;
  openedAt: Date;
  guestLabel: string | null;
}

export interface StaffCallRecord {
  reason: CallStaffReason | null;
  note: string | null;
  calledAt: Date;
}

export interface SeatWithLiveVisit extends SeatIdentity {
  currentVisit: LiveVisitCard | null;
  staffCall: StaffCallRecord | null;
}
