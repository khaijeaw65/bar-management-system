import type { CallStaffReason, TableSeatKind, VisitState } from '@bar/contracts';

export interface SeatVisitRow {
  id: string;
  label: string;
  kind: TableSeatKind;
  sort_order: number | string;
  visit_id: string | null;
  state: VisitState | null;
  opened_at: Date | string | null;
  guest_label: string | null;
  staff_called_at: Date | string | null;
  staff_call_reason: CallStaffReason | null;
  staff_call_note: string | null;
}

export interface SeatAdminRow {
  id: string;
  label: string;
  kind: TableSeatKind;
  sort_order: number | string;
  is_active: boolean;
  qr_token: string | null;
  has_live_visit: boolean | string | number;
}
