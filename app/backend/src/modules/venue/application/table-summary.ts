import type { TableSummary } from '@bar/contracts';
import type {
  LiveVisitCard,
  SeatWithLiveVisit,
} from '../domain/table-seat.types.js';

const EMPTY_BILL = {
  total: '0.00',
  itemCount: 0,
  staffCalled: false,
} as const;

export function toTableSummary(seat: SeatWithLiveVisit): TableSummary {
  return {
    id: seat.id,
    label: seat.label,
    kind: seat.kind,
    sortOrder: seat.sortOrder,
    currentVisit: seat.currentVisit ? toCurrentVisit(seat.currentVisit) : null,
  };
}

function toCurrentVisit(visit: LiveVisitCard): TableSummary['currentVisit'] {
  return {
    id: visit.id,
    state: visit.state,
    openedAt: visit.openedAt.toISOString(),
    guestLabel: visit.guestLabel,
    ...EMPTY_BILL,
  };
}
