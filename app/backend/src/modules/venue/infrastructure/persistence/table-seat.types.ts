import type { TableSeatKind, VisitState } from '@bar/contracts';

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
  staff_call_reason: 'bill' | 'other' | null;
  staff_call_note: string | null;
}
