import type { Visit } from '@bar/contracts';
import type { VisitView } from '../../application/visit.types.js';

export function toVisitBody(visit: VisitView): Visit {
  return {
    id: visit.id,
    tableSeatId: visit.tableSeatId,
    seatLabel: visit.seatLabel,
    seatKind: visit.seatKind,
    state: visit.state,
    openedAt: visit.openedAt.toISOString(),
    closedAt: visit.closedAt ? visit.closedAt.toISOString() : null,
    guestLabel: visit.guestLabel,
    openedBy: visit.opener,
    openedVia: visit.openedVia,
  };
}
