import type { TableSummary } from '@bar/contracts';
import type {
  LiveVisitCard,
  SeatWithLiveVisit,
  StaffCallRecord,
} from '../domain/table-seat.types.js';

const EMPTY_BILL = {
  total: '0.00',
  itemCount: 0,
  paymentPending: false,
} as const;

export function toTableSummary(seat: SeatWithLiveVisit): TableSummary {
  return {
    id: seat.id,
    label: seat.label,
    kind: seat.kind,
    sortOrder: seat.sortOrder,
    currentVisit: seat.currentVisit ? toCurrentVisit(seat.currentVisit, seat.staffCall !== null) : null,
    staffCall: seat.staffCall ? toStaffCall(seat.staffCall) : null,
  };
}

function toStaffCall(call: StaffCallRecord): NonNullable<TableSummary['staffCall']> {
  return { reason: call.reason, note: call.note, calledAt: call.calledAt.toISOString() };
}

function toCurrentVisit(visit: LiveVisitCard, staffCalled: boolean): TableSummary['currentVisit'] {
  return {
    id: visit.id,
    state: visit.state,
    openedAt: visit.openedAt.toISOString(),
    guestLabel: visit.guestLabel,
    staffCalled,
    ...EMPTY_BILL,
  };
}
