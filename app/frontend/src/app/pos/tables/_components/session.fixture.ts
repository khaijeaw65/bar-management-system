import type { Order, OrderLine, Ticket, Visit, VisitDetail } from "@bar/contracts";

export const drawerVisitId = "20000000-0000-4000-8000-000000000099";

const staff = { staffId: "11111111-1111-4111-8111-111111111111", displayName: "บีม" };
const seat = { id: "10000000-0000-4000-8000-000000000003", label: "T3", kind: "table" as const };

export function orderLine(id: string, name: string, extra: Partial<OrderLine> = {}): OrderLine {
  return {
    id,
    variantId: id,
    name,
    variantName: "ปกติ",
    quantity: 1,
    unitPrice: "120.00",
    modifiers: [],
    lineTotal: "120.00",
    orderedByName: null,
    notes: null,
    cancelledAt: null,
    cancellation: null,
    ...extra,
  };
}

export function ticket(id: string, orderNumber: number, items: OrderLine[], extra: Partial<Ticket> = {}): Ticket {
  return {
    id,
    orderId: id,
    orderNumber,
    station: "bar",
    status: "pending",
    seat,
    items,
    issue: null,
    acceptedBy: null,
    sentAt: null,
    createdAt: "2026-10-21T12:02:00.000Z",
    updatedAt: "2026-10-21T12:02:00.000Z",
    ...extra,
  };
}

export function order(id: string, orderNumber: number, createdAt: string, tickets: Ticket[], total: string): Order {
  return {
    id,
    visitId: drawerVisitId,
    orderNumber,
    businessDate: "2026-10-21",
    createdAt,
    createdBy: staff,
    tickets,
    total,
  };
}

export function visitDetail(extra: Partial<VisitDetail> = {}): VisitDetail {
  return {
    id: drawerVisitId,
    tableSeatId: seat.id,
    seatLabel: "T3",
    seatKind: "table",
    state: "active",
    openedAt: "2026-10-21T10:38:00.000Z",
    closedAt: null,
    guestLabel: "ต้น",
    openedBy: staff,
    openedVia: "pos",
    orders: [],
    bill: { total: "0.00", paid: "0.00", remaining: "0.00", locked: false },
    payments: [],
    ...extra,
  };
}

export function closedVisit(detail: VisitDetail): Visit {
  return {
    id: detail.id,
    tableSeatId: detail.tableSeatId,
    seatLabel: detail.seatLabel,
    seatKind: detail.seatKind,
    state: "closed",
    openedAt: detail.openedAt,
    closedAt: "2026-10-21T13:00:00.000Z",
    guestLabel: detail.guestLabel,
    openedBy: detail.openedBy,
    openedVia: detail.openedVia,
  };
}

export const venueOn = {
  name: "The Loft",
  slug: "the-loft",
  kitchenDisplayEnabled: true,
  businessDayCutoff: "06:00",
  counterQrEnabled: false,
};
