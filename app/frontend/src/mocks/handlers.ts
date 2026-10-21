import type { MenuItem, TableSummary, Visit, VisitDetail } from "@bar/contracts";
import { http, HttpResponse } from "msw";

export const staffMe = {
  id: "11111111-1111-4111-8111-111111111111",
  displayName: "Beam",
  avatarUrl: null,
};

const beerId = "c1111111-1111-4111-8111-111111111111";
const cocktailId = "c2222222-2222-4222-8222-222222222222";
const foodId = "c3333333-3333-4333-8333-333333333333";

export const menuCategories = [
  { id: beerId, name: "เบียร์", sortOrder: 0 },
  { id: cocktailId, name: "ค็อกเทล", sortOrder: 1 },
  { id: foodId, name: "อาหาร", sortOrder: 2 },
];

function item(
  overrides: Pick<MenuItem, "id" | "categoryId" | "name" | "basePrice"> & Partial<MenuItem>,
): MenuItem {
  return {
    description: null,
    imageUrl: null,
    itemType: "simple",
    station: "bar",
    isPromo: false,
    sortOrder: 0,
    availableNow: true,
    unavailableReason: null,
    windows: [],
    variants: [
      {
        id: overrides.id,
        name: "ปกติ",
        price: overrides.basePrice,
        isAvailable: true,
        modifierGroups: [],
      },
    ],
    ...overrides,
  };
}

export const menuItems: MenuItem[] = [
  item({
    id: "11111111-1111-4111-8111-111111111111",
    categoryId: beerId,
    name: "สิงห์",
    basePrice: "120.00",
  }),
  item({
    id: "22222222-2222-4222-8222-222222222222",
    categoryId: cocktailId,
    name: "โมฮิโต้",
    basePrice: "180.00",
    variants: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "ปกติ",
        price: "180.00",
        isAvailable: true,
        modifierGroups: [],
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        name: "ใหญ่",
        price: "240.00",
        isAvailable: true,
        modifierGroups: [],
      },
    ],
  }),
  item({
    id: "33333333-3333-4333-8333-333333333333",
    categoryId: foodId,
    name: "ปีกไก่ทอด",
    basePrice: "150.00",
    station: "food",
    isPromo: true,
    availableNow: false,
    unavailableReason: "out_of_window",
  }),
  item({
    id: "44444444-4444-4444-8444-444444444444",
    categoryId: cocktailId,
    name: "วิสกี้ซาวร์",
    basePrice: "220.00",
    availableNow: false,
    unavailableReason: "sold_out",
  }),
];

export function apiEnvelope(
  data: unknown,
  status = 200,
  code = "",
  message: string | string[] = "success",
) {
  return { status, code, message, data };
}

function json(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json(apiEnvelope(data, status, code, message), { status });
}

const seat = (
  id: string,
  label: string,
  kind: TableSummary["kind"],
  sortOrder: number,
  currentVisit: TableSummary["currentVisit"],
): TableSummary => ({ id, label, kind, sortOrder, currentVisit });

const visitOn = (
  id: string,
  openedAt: string,
  guestLabel: string,
  itemCount: number,
  total: string,
  paymentPending = false,
): TableSummary["currentVisit"] => ({
  id,
  state: itemCount > 0 ? "active" : "open",
  openedAt,
  guestLabel,
  total,
  itemCount,
  staffCalled: false,
  paymentPending,
});

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000 - 30_000).toISOString();
}

export const openedVisitId = "20000000-0000-4000-8000-000000000006";
export const attachedVisitId = "20000000-0000-4000-8000-000000000005";

const seatIds = {
  c1: "10000000-0000-4000-8000-000000000001",
  c4: "10000000-0000-4000-8000-000000000002",
  t3: "10000000-0000-4000-8000-000000000003",
  t2: "10000000-0000-4000-8000-000000000004",
  t6: "10000000-0000-4000-8000-000000000006",
  t5: "10000000-0000-4000-8000-000000000005",
};

function buildSeats(): TableSummary[] {
  return [
    seat(seatIds.t6, "T6", "table", 5, null),
    seat(seatIds.c4, "C4", "counter", 2, visitOn("20000000-0000-4000-8000-000000000002", minutesAgo(12), "ฟ้า", 0, "0.00")),
    seat(seatIds.t5, "T5", "table", 6, null),
    seat(
      seatIds.t3,
      "T3",
      "table",
      3,
      visitOn(
        "20000000-0000-4000-8000-000000000003",
        minutesAgo(84),
        "มิ้นท์, เจ, ต้อม และเพื่อนอีกหลายคน",
        5,
        "1240.00",
      ),
    ),
    seat(seatIds.c1, "C1", "counter", 1, null),
    seat(seatIds.t2, "T2", "table", 4, visitOn("20000000-0000-4000-8000-000000000004", minutesAgo(10), "ต้น", 2, "480.00", true)),
  ];
}

let seats = buildSeats();

export function currentSeats(): TableSummary[] {
  return seats;
}

export function resetFloor(): void {
  seats = buildSeats();
}

function asVisit(seatRow: TableSummary, visit: Pick<Visit, "id" | "guestLabel" | "openedAt" | "openedBy" | "openedVia">): Visit {
  return {
    id: visit.id,
    tableSeatId: seatRow.id,
    seatLabel: seatRow.label,
    seatKind: seatRow.kind,
    state: "open",
    openedAt: visit.openedAt,
    closedAt: null,
    guestLabel: visit.guestLabel,
    openedBy: visit.openedBy,
    openedVia: visit.openedVia,
  };
}

function remember(visit: Visit): void {
  seats = seats.map((row) =>
    row.id === visit.tableSeatId
      ? {
          ...row,
          currentVisit: {
            id: visit.id,
            state: "open",
            openedAt: visit.openedAt,
            guestLabel: visit.guestLabel,
            total: "0.00",
            itemCount: 0,
            staffCalled: false,
            paymentPending: false,
          },
        }
      : row,
  );
}

const venueSettings = {
  name: "The Loft",
  slug: "the-loft",
  kitchenDisplayEnabled: false,
  businessDayCutoff: "06:00",
  counterQrEnabled: false,
};

function detailFor(row: TableSummary): VisitDetail | null {
  const visit = row.currentVisit;
  if (!visit) return null;
  return {
    id: visit.id,
    tableSeatId: row.id,
    seatLabel: row.label,
    seatKind: row.kind,
    state: visit.state,
    openedAt: visit.openedAt,
    closedAt: null,
    guestLabel: visit.guestLabel,
    openedBy: null,
    openedVia: "pos",
    orders: [],
    bill: {
      total: visit.total,
      paid: "0.00",
      remaining: visit.total,
      locked: visit.paymentPending,
    },
    payments: [],
  };
}

function closedBody(row: TableSummary): Visit {
  const visit = row.currentVisit;
  if (!visit) throw new Error("seat has no visit");
  return {
    ...asVisit(row, {
      id: visit.id,
      guestLabel: visit.guestLabel,
      openedAt: visit.openedAt,
      openedBy: null,
      openedVia: "pos",
    }),
    state: "closed",
    closedAt: new Date().toISOString(),
  };
}

export const handlers = [
  http.get("*/api/auth/me", () => json(staffMe)),
  http.post("*/api/auth/refresh", () => json({ ok: true })),
  http.post("*/api/auth/logout", () => json({ ok: true })),
  http.get("*/api/menu/items", () => json({ items: menuItems })),
  http.get("*/api/menu/categories", () => json({ items: menuCategories })),
  http.get("*/api/tables", () => json({ items: seats })),
  http.post("*/api/visits", async ({ request }) => {
    const body = (await request.json()) as { tableSeatId?: string; guestLabel?: string | null };
    const row = seats.find((item) => item.id === body.tableSeatId);
    if (!row) return json(null, 404, "NOT_FOUND", "ไม่พบโต๊ะ");
    const typed = typeof body.guestLabel === "string" ? body.guestLabel.trim() : "";
    if (row.label === "T5") {
      const visit = asVisit(row, {
        id: attachedVisitId,
        guestLabel: "ฝน",
        openedAt: "2026-10-21T14:12:00.000Z",
        openedBy: null,
        openedVia: "qr",
      });
      remember(visit);
      return json({ visit, attached: true }, 200);
    }
    const visit = asVisit(row, {
      id: openedVisitId,
      guestLabel: typed || null,
      openedAt: new Date().toISOString(),
      openedBy: { staffId: staffMe.id, displayName: staffMe.displayName },
      openedVia: "pos",
    });
    remember(visit);
    return json({ visit, attached: false }, 201);
  }),
  http.get("*/api/venue", () => json(venueSettings)),
  http.get("*/api/visits/:id", ({ params }) => {
    const id = String(params.id);
    const row = seats.find((item) => item.currentVisit?.id === id);
    const detail = row ? detailFor(row) : null;
    if (!detail) return json(null, 404, "NOT_FOUND", "ไม่พบการเข้าใช้");
    return json(detail);
  }),
  http.post("*/api/visits/:id/close", ({ params }) => {
    const id = String(params.id);
    const row = seats.find((item) => item.currentVisit?.id === id);
    if (!row?.currentVisit) return json(null, 409, "INVALID_STATE_TRANSITION", "สถานะโต๊ะไม่ถูกต้อง");
    if (row.currentVisit.paymentPending) return json(null, 409, "PAYMENT_IN_FLIGHT", "มีการชำระเงินค้างอยู่");
    const closed = closedBody(row);
    seats = seats.map((item) => (item.id === row.id ? { ...item, currentVisit: null } : item));
    return json(closed);
  }),
];
