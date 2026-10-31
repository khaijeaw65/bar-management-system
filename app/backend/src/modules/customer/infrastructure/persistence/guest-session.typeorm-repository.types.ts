import type { TableSeatKind, VisitState } from '@bar/contracts';

export interface SessionJoinRow {
  id: unknown;
  visit_id: unknown;
  display_name: unknown;
  expires_at: unknown;
  created_at: unknown;
  seat_id: unknown;
  label: unknown;
  kind: TableSeatKind;
  is_active: boolean;
  visit_state: VisitState | null;
}
