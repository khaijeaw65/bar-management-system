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

export interface SeatAdminRecord {
  id: string;
  label: string;
  kind: TableSeatKind;
  sortOrder: number;
  isActive: boolean;
  qrToken: string | null;
  hasLiveVisit: boolean;
}

export interface SeatSortOrderItem {
  id: string;
  sortOrder: number;
}

export class DuplicateSeatLabelException extends Error {
  public constructor(message = 'Duplicate active seat label') {
    super(message);
    this.name = 'DuplicateSeatLabelException';
  }
}

export interface CreateSeatRecordInput {
  label: string;
  kind: TableSeatKind;
  sortOrder: number;
  qrToken: string;
}

export interface UpdateSeatRecordInput {
  label?: string;
  kind?: TableSeatKind;
  sortOrder?: number;
  isActive?: boolean;
}
