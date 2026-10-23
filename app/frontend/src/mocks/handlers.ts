import type { MenuItem, Order, OrderLine, Payment, PaymentAttempt, PaymentMethod, PlaceOrderRequest, TableSummary, Ticket, Visit, VisitDetail } from "@bar/contracts";
import { UpdateVenuePaymentSettingsSchema, UpdateVenueSettingsSchema } from "@bar/contracts";
import { http, HttpResponse } from "msw";
import { scaleMoney, sumMoney } from "@/lib/utils/money";
import { createMenuHandlers } from "./menu";
import { reportHandlers } from "./reports";

export const staffMe = {
  id: "11111111-1111-4111-8111-111111111111",
  displayName: "Beam",
  avatarUrl: null,
};

const beerId = "c1111111-1111-4111-8111-111111111111";
const cocktailId = "c2222222-2222-4222-8222-222222222222";
const foodId = "c3333333-3333-4333-8333-333333333333";

export const menuCategories = [
  { id: beerId, name: "เบียร์", sortOrder: 0, isActive: true, itemCount: 1 },
  { id: cocktailId, name: "ค็อกเทล", sortOrder: 1, isActive: true, itemCount: 2 },
  { id: foodId, name: "อาหาร", sortOrder: 2, isActive: true, itemCount: 1 },
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
    updatedAt: "2026-10-01T00:00:00.000Z",
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
    windows: [{ daysOfWeek: [5, 6], startTime: "22:00", endTime: "23:59" }],
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

function json(data: unknown, status = 200, code = "", message: string | string[] = "success") {
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

const boardStaff = { staffId: staffMe.id, displayName: staffMe.displayName };

function boardLine(id: string, name: string, quantity = 1, extra: Partial<OrderLine> = {}): OrderLine {
  return {
    id,
    variantId: id,
    name,
    variantName: "ปกติ",
    quantity,
    unitPrice: "120.00",
    modifiers: [],
    lineTotal: scaleMoney("120.00", quantity),
    orderedByName: null,
    notes: null,
    cancelledAt: null,
    cancellation: null,
    ...extra,
  };
}

function boardTicket(n: number, seatId: string, label: string, status: Ticket["status"], extra: Partial<Ticket> = {}): Ticket {
  const at = minutesAgo(40 - n * 5);
  return {
    id: `60000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
    orderId: `30000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
    orderNumber: 40 + n,
    station: "bar",
    status,
    seat: { id: seatId, label, kind: label.startsWith("C") ? "counter" : "table" },
    items: [boardLine(`70000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`, "สิงห์", 2)],
    issue: null,
    acceptedBy: null,
    sentAt: null,
    createdAt: at,
    updatedAt: at,
    ...extra,
  };
}

function buildTickets(): Ticket[] {
  return [
    boardTicket(1, seatIds.t3, "T3", "pending"),
    boardTicket(2, seatIds.c4, "C4", "accepted", { acceptedBy: boardStaff }),
    boardTicket(3, seatIds.t2, "T2", "issue", {
      issue: {
        reason: "out_of_stock",
        itemId: "70000000-0000-4000-8000-000000000003",
        note: "น้ำแข็งหมด",
        reportedBy: { staffId: staffMe.id, displayName: "นุ่น" },
        escalatedAt: minutesAgo(3),
      },
    }),
  ];
}

let tickets = buildTickets();

function moveTicket(id: string, from: Ticket["status"][], patch: Partial<Ticket>) {
  const found = tickets.find((ticket) => ticket.id === id);
  if (!found) return json(null, 404, "NOT_FOUND", "ไม่พบออเดอร์");
  if (!from.includes(found.status)) return json(null, 409, "INVALID_STATE_TRANSITION", "สถานะออเดอร์ไม่ถูกต้อง");
  const next = { ...found, ...patch, updatedAt: new Date().toISOString() };
  tickets = tickets.map((ticket) => (ticket.id === id ? next : ticket));
  return json(next);
}

export function currentSeats(): TableSummary[] {
  return seats;
}

const ordersByVisit = new Map<string, Order[]>();
const placedByKey = new Map<string, { body: string; order: Order }>();
const paymentById = new Map<string, Payment>();
const paymentByKey = new Map<string, { body: string; attempt: PaymentAttempt }>();
const settlement = new Map<string, { paid: string; remaining: string; locked: boolean }>();
let nextOrderNumber = 1;

export function resetFloor(): void {
  seats = buildSeats();
  ordersByVisit.clear();
  placedByKey.clear();
  paymentById.clear();
  paymentByKey.clear();
  settlement.clear();
  tickets = buildTickets();
  nextOrderNumber = 1;
  venueSettings = { ...initialVenue };
  paymentSettings = { ...initialPaymentSettings };
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

const initialVenue = {
  name: "The Loft",
  slug: "the-loft",
  kitchenDisplayEnabled: false,
  businessDayCutoff: "06:00",
  counterQrEnabled: false,
};
let venueSettings = { ...initialVenue };

const initialPaymentSettings = {
  paymentMode: "own_promptpay" as const,
  promptpayIdType: "mobile" as "mobile" | "national_id" | "ewallet" | null,
  promptpayIdMasked: "XXX-XXX-5678" as string | null,
};
let paymentSettings = { ...initialPaymentSettings };

function patchVenue(raw: unknown) {
  const parsed = UpdateVenueSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return json(null, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message));
  }
  venueSettings = { ...venueSettings, ...parsed.data };
  return json(venueSettings);
}

function patchPromptPay(raw: unknown) {
  const parsed = UpdateVenuePaymentSettingsSchema.safeParse(raw);
  const digits = parsed.success ? parsed.data.promptpayId.replaceAll(/\D/g, "") : "";
  if (!parsed.success || (parsed.data.promptpayIdType === "mobile" && !/^0\d{9}$/.test(digits))) {
    return json(null, 400, "VALIDATION_ERROR", ["รูปแบบพร้อมเพย์ไม่ถูกต้อง"]);
  }
  if (seats.some((row) => row.currentVisit?.paymentPending)) {
    return json(null, 409, "PAYMENT_IN_FLIGHT", "มีการชำระเงินค้างอยู่");
  }
  paymentSettings = {
    ...paymentSettings,
    promptpayIdType: parsed.data.promptpayIdType,
    promptpayIdMasked: `XXX-XXX-${digits.slice(-4)}`,
  };
  return json(paymentSettings);
}

function billFor(visit: NonNullable<TableSummary["currentVisit"]>): VisitDetail["bill"] {
  const orders = ordersByVisit.get(visit.id) ?? [];
  const total = orders.length > 0 ? sumMoney(orders.map((order) => order.total)) : visit.total;
  const extra = settlement.get(visit.id);
  if (extra) return { total, paid: extra.paid, remaining: extra.remaining, locked: extra.locked };
  return { total, paid: "0.00", remaining: total, locked: visit.paymentPending };
}

function lineFor(entry: PlaceOrderRequest["items"][number]): OrderLine {
  let found: { item: MenuItem; variant: MenuItem["variants"][number] } | undefined;
  for (const item of menuItems) {
    const variant = item.variants.find((option) => option.id === entry.variantId);
    if (variant) {
      found = { item, variant };
      break;
    }
  }
  const options = found?.variant.modifierGroups.flatMap((group) => group.options) ?? [];
  const chosen = options.filter((option) => entry.modifierOptionIds?.includes(option.id));
  const unitPrice = sumMoney([found?.variant.price ?? "0.00", ...chosen.map((option) => option.priceDelta)]);
  return {
    id: crypto.randomUUID(),
    variantId: entry.variantId,
    name: found?.item.name ?? "รายการ",
    variantName: found?.variant.name ?? "ปกติ",
    quantity: entry.quantity,
    unitPrice,
    modifiers: chosen.map((option) => ({ optionId: option.id, name: option.name, priceDelta: option.priceDelta })),
    lineTotal: scaleMoney(unitPrice, entry.quantity),
    orderedByName: entry.orderedByName ?? null,
    notes: entry.notes ?? null,
    cancelledAt: null,
    cancellation: null,
  };
}

function rememberOrder(visitId: string, order: Order): void {
  tickets = [...tickets, ...order.tickets];
  const orders = [order, ...(ordersByVisit.get(visitId) ?? [])];
  ordersByVisit.set(visitId, orders);
  const total = sumMoney(orders.map((entry) => entry.total));
  const itemCount = orders.reduce(
    (sum, entry) => sum + entry.tickets.reduce((count, ticket) => count + ticket.items.reduce((qty, line) => qty + line.quantity, 0), 0),
    0,
  );
  seats = seats.map((row) =>
    row.currentVisit?.id === visitId
      ? { ...row, currentVisit: { ...row.currentVisit, state: "active", total, itemCount } }
      : row,
  );
}

function buildOrder(visitId: string, items: PlaceOrderRequest["items"]): Order {
  const now = new Date().toISOString();
  const row = seats.find((seat) => seat.currentVisit?.id === visitId);
  const lines = items.map((entry) => lineFor(entry));
  const id = crypto.randomUUID();
  const orderNumber = nextOrderNumber;
  nextOrderNumber += 1;
  return {
    id,
    visitId,
    orderNumber,
    businessDate: now.slice(0, 10),
    createdAt: now,
    createdBy: { staffId: staffMe.id, displayName: staffMe.displayName },
    total: sumMoney(lines.map((line) => line.lineTotal)),
    tickets: [
      {
        id: crypto.randomUUID(),
        orderId: id,
        orderNumber,
        station: "bar",
        status: "pending",
        seat: { id: row?.id ?? visitId, label: row?.label ?? "โต๊ะ", kind: row?.kind ?? "table" },
        items: lines,
        issue: null,
        acceptedBy: null,
        sentAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

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
    orders: ordersByVisit.get(visit.id) ?? [],
    bill: billFor(visit),
    payments: attemptsFor(visit.id),
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

function attemptOf(payment: Payment): PaymentAttempt {
  return {
    attemptId: payment.attemptId,
    visitId: payment.visitId,
    mode: "merge",
    total: payment.amount,
    parts: [payment],
  };
}

function attemptsFor(visitId: string): PaymentAttempt[] {
  const byAttempt = new Map<string, Payment[]>();
  for (const payment of paymentById.values()) {
    if (payment.visitId !== visitId) continue;
    const parts = byAttempt.get(payment.attemptId) ?? [];
    parts.push(payment);
    byAttempt.set(payment.attemptId, parts);
  }
  return [...byAttempt.entries()].map(([attemptId, parts]) => ({
    attemptId,
    visitId,
    mode: "merge" as const,
    total: parts[0]?.amount ?? "0.00",
    parts,
  }));
}

function buildPayment(visitId: string, method: PaymentMethod, amount: string): Payment {
  const cash = method === "cash";
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    attemptId: crypto.randomUUID(),
    visitId,
    partNo: 1,
    partCount: 1,
    amount,
    method,
    status: cash ? "completed" : "pending",
    confirmedVia: cash ? "cash" : null,
    statusReason: null,
    statusNote: null,
    qrPayload: cash ? null : "00020101021229370016A000000677010111",
    expiresAt: cash ? null : new Date(Date.now() + 15 * 60_000).toISOString(),
    paidAt: cash ? now : null,
    createdBy: staffMe.id,
    updatedBy: null,
    createdAt: now,
  };
}

function settle(visitId: string, paid: string, remaining: string, locked: boolean): void {
  settlement.set(visitId, { paid, remaining, locked });
  seats = seats.map((row) =>
    row.currentVisit?.id === visitId
      ? { ...row, currentVisit: { ...row.currentVisit, paymentPending: locked } }
      : row,
  );
}

export const handlers = [
  http.get("*/api/auth/me", () => json(staffMe)),
  http.post("*/api/auth/refresh", () => json({ ok: true })),
  http.post("*/api/auth/logout", () => json({ ok: true })),
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
  ...reportHandlers,
  ...createMenuHandlers(menuItems, menuCategories),
  http.get("*/api/venue", () => json(venueSettings)),
  http.patch("*/api/venue/settings", async ({ request }) => patchVenue(await request.json())),
  http.get("*/api/venue/payment-settings", () => json(paymentSettings)),
  http.patch("*/api/venue/payment-settings", async ({ request }) => patchPromptPay(await request.json())),
  http.get("*/api/tickets", ({ request }) => {
    const wanted = new URL(request.url).searchParams.get("status")?.split(",") ?? ["pending", "accepted", "ready"];
    return json({ items: tickets.filter((ticket) => wanted.includes(ticket.status)) });
  }),
  http.post("*/api/tickets/:id/accept", ({ params }) =>
    moveTicket(String(params.id), ["pending"], { status: "accepted", acceptedBy: boardStaff }),
  ),
  http.post("*/api/tickets/:id/ready", ({ params }) => moveTicket(String(params.id), ["accepted"], { status: "ready" })),
  http.post("*/api/tickets/:id/send", ({ params }) =>
    moveTicket(String(params.id), ["accepted", "ready"], { status: "sent", sentAt: new Date().toISOString() }),
  ),
  http.post("*/api/tickets/:id/resolve", ({ params }) =>
    moveTicket(String(params.id), ["issue"], { status: "accepted", issue: null }),
  ),
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
  http.post("*/api/visits/:id/orders", async ({ request, params }) => {
    const visitId = String(params.id);
    const key = request.headers.get("Idempotency-Key") ?? "";
    const raw = (await request.json()) as PlaceOrderRequest;
    const body = JSON.stringify(raw);
    const prior = key ? placedByKey.get(key) : undefined;
    if (prior && key) {
      if (prior.body !== body) return json(null, 409, "IDEMPOTENCY_KEY_REUSED", "ส่งอีกครั้งได้");
      return json(prior.order, 201);
    }
    const items = raw.items ?? [];
    // ponytail: the 409 e2e has no live menu toggle, so a note of หมดทดสอบ stands in for a stale tile.
    if (items.some((item) => item.notes === "หมดทดสอบ")) {
      return json(
        { details: items.map((item) => ({ variantId: item.variantId, reason: "sold_out" as const })) },
        409,
        "ITEM_UNAVAILABLE",
        "สินค้าหมด",
      );
    }
    const row = seats.find((seat) => seat.currentVisit?.id === visitId);
    if (!row?.currentVisit) return json(null, 409, "INVALID_STATE_TRANSITION", "สถานะโต๊ะไม่ถูกต้อง");
    const order = buildOrder(visitId, items);
    if (key) placedByKey.set(key, { body, order });
    rememberOrder(visitId, order);
    return json(order, 201);
  }),
  http.post("*/api/visits/:id/payments", async ({ request, params }) => {
    const visitId = String(params.id);
    const key = request.headers.get("Idempotency-Key") ?? "";
    const raw = (await request.json()) as { method?: PaymentMethod };
    const body = JSON.stringify({ method: raw.method, mode: "merge" });
    const prior = key ? paymentByKey.get(key) : undefined;
    if (prior && key) {
      if (prior.body !== body) return json(null, 409, "IDEMPOTENCY_KEY_REUSED", "ส่งอีกครั้งได้");
      return json(prior.attempt, 201);
    }
    const row = seats.find((seat) => seat.currentVisit?.id === visitId);
    if (!row?.currentVisit) return json(null, 404, "NOT_FOUND", "ไม่พบการเข้าใช้");
    const bill = billFor(row.currentVisit);
    const pending = [...paymentById.values()].find((item) => item.visitId === visitId && item.status === "pending");
    if (pending) return json({ details: attemptOf(pending) }, 409, "PAYMENT_IN_FLIGHT", "มีการชำระเงินที่ยังไม่จบ");
    if (bill.remaining === "0.00") return json(null, 409, "NOTHING_TO_PAY", "ไม่มียอดที่ต้องชำระ");
    const method = raw.method === "cash" ? "cash" : "promptpay";
    const payment = buildPayment(visitId, method, bill.remaining);
    const attempt = attemptOf(payment);
    paymentById.set(payment.id, payment);
    if (key) paymentByKey.set(key, { body, attempt });
    if (method === "cash") settle(visitId, payment.amount, "0.00", false);
    else settle(visitId, "0.00", bill.remaining, true);
    return json(attempt, 201);
  }),
  http.get("*/api/payments/:id", ({ params }) => {
    const payment = paymentById.get(String(params.id));
    if (!payment) return json(null, 404, "NOT_FOUND", "ไม่พบการชำระเงิน");
    return json(payment);
  }),
  http.post("*/api/payments/:id/cancel", ({ params }) => {
    const payment = paymentById.get(String(params.id));
    if (!payment) return json(null, 404, "NOT_FOUND", "ไม่พบการชำระเงิน");
    if (payment.status !== "pending") return json(null, 409, "INVALID_STATE_TRANSITION", "สถานะการชำระเงินไม่ถูกต้อง");
    const next = { ...payment, status: "cancelled" as const, statusReason: "staff_cancel" as const };
    paymentById.set(payment.id, next);
    settle(payment.visitId, "0.00", payment.amount, false);
    return json(next);
  }),
  http.post("*/api/payments/:id/mark-paid", async ({ request, params }) => {
    const payment = paymentById.get(String(params.id));
    if (!payment) return json(null, 404, "NOT_FOUND", "ไม่พบการชำระเงิน");
    if (payment.status !== "pending") return json(null, 409, "INVALID_STATE_TRANSITION", "สถานะการชำระเงินไม่ถูกต้อง");
    const raw = (await request.json()) as { reason?: Payment["statusReason"]; note?: string };
    const next: Payment = {
      ...payment,
      status: "completed",
      confirmedVia: "manual",
      statusReason: raw.reason ?? null,
      statusNote: raw.note ?? null,
      paidAt: new Date().toISOString(),
    };
    paymentById.set(payment.id, next);
    settle(payment.visitId, payment.amount, "0.00", false);
    return json(next);
  }),
];
