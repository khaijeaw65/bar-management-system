import type { TableSeatKind, VisitState } from '@bar/contracts';

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

export interface SeatWithLiveVisit extends SeatIdentity {
  currentVisit: LiveVisitCard | null;
}
