import type { CustomerMenu, CustomerMenuItem, CustomerSession, CustomerTab, CustomerTabOrder } from "@bar/contracts";
import { http, HttpResponse } from "msw";

const id = (n: number): string => `c0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const guestQr = "qr-t3";
const seatId = id(900);
const categories = [
  { id: id(1), name: "เครื่องดื่ม", sortOrder: 0 },
  { id: id(2), name: "อาหาร", sortOrder: 1 },
];

function plain(n: number, categoryId: string, name: string, price: string, extra: Partial<CustomerMenuItem> = {}): CustomerMenuItem {
  return {
    id: id(n),
    categoryId,
    name,
    description: null,
    imageUrl: null,
    isPromo: false,
    basePrice: price,
    availableNow: true,
    unavailableReason: null,
    windows: [],
    variants: [{ id: id(n + 100), name: "ปกติ", price, isAvailable: true, modifierGroups: [] }],
    ...extra,
  };
}

const iceGroup = {
  id: id(500),
  name: "ระดับน้ำแข็ง",
  isRequired: true,
  minSelect: 1,
  maxSelect: 1,
  options: [
    { id: id(501), name: "ปกติ", priceDelta: "0.00", isAvailable: true },
    { id: id(502), name: "น้ำแข็งน้อย", priceDelta: "0.00", isAvailable: true },
  ],
};

export const customerItems: CustomerMenuItem[] = [
  plain(10, categories[0].id, "ช้างดราฟต์", "120.00"),
  plain(11, categories[0].id, "โอลด์แฟชั่น", "260.00", {
    variants: [{ id: id(111), name: "ปกติ", price: "260.00", isAvailable: true, modifierGroups: [iceGroup] }],
  }),
  plain(12, categories[1].id, "ถั่วทอดสมุนไพร", "80.00"),
  plain(13, categories[1].id, "ยำหมูยอ", "150.00"),
  plain(14, categories[1].id, "ปีกไก่ทอด", "150.00", {
    isPromo: true,
    availableNow: false,
    unavailableReason: "out_of_window",
    windows: [{ daysOfWeek: [5, 6], startTime: "22:00", endTime: "23:59" }],
  }),
  plain(15, categories[0].id, "วิสกี้ซาวร์", "220.00", { availableNow: false, unavailableReason: "sold_out" }),
  plain(16, categories[0].id, "บัคเก็ตโปร", "399.00", {
    isPromo: true,
    windows: [{ daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startTime: "17:00", endTime: "21:00" }],
  }),
];

const customerMenu: CustomerMenu = { categories, items: customerItems };

function envelope(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json({ status, code, message, data }, { status });
}

function session(displayName: string | null): CustomerSession {
  return {
    seat: { id: seatId, label: "T3", kind: "table" },
    visitId: null,
    displayName,
    expiresAt: "2099-01-01T00:00:00.000Z",
  };
}

let displayName: string | null = null;
let nextNumber = 1;
const dropped = new Set<string>();
const placed = new Map<string, { body: string; result: { orderId: string; orderNumber: number; visitId: string } }>();

let tabOrders: CustomerTabOrder[] = [];

export function resetCustomer(): void {
  displayName = null;
  nextNumber = 1;
  placed.clear();
  dropped.clear();
  tabOrders = [];
}

function variantLine(variantId: string, quantity: number) {
  const item = customerItems.find((entry) => entry.variants.some((variant) => variant.id === variantId));
  const variant = item?.variants.find((entry) => entry.id === variantId);
  const unit = Number(variant?.price ?? 0);
  return {
    itemName: item?.name ?? "",
    variantName: variant?.name ?? "",
    modifiers: [],
    quantity,
    unitPrice: unit.toFixed(2),
    lineTotal: (unit * quantity).toFixed(2),
    orderedByName: displayName,
    cancelled: false,
  };
}

function tabOf(): CustomerTab {
  const total = tabOrders.flatMap((order) => order.lines).filter((line) => !line.cancelled).reduce((sum, line) => sum + Number(line.lineTotal), 0);
  return {
    visitId: tabOrders.length > 0 ? id(800) : null,
    orders: [...tabOrders].reverse(),
    total: total.toFixed(2),
    asOf: new Date().toISOString(),
  };
}

// ponytail: the e2e plays the POS through these (the browser worker runs in the page, so `window` reaches them).
export const customerMockControls = {
  addOtherOrder(): void {
    tabOrders.push({
      orderNumber: nextNumber++,
      placedAt: new Date().toISOString(),
      mine: false,
      tickets: [{ station: "bar", status: "pending" }],
      lines: [{ ...variantLine(id(112), 1), orderedByName: "เอก" }],
    });
  },
  acceptAll(): void {
    for (const order of tabOrders) order.tickets = order.tickets.map((ticket) => ({ ...ticket, status: "accepted" }));
  },
  cancelFirstLine(): void {
    const line = tabOrders[0]?.lines[0];
    if (line) line.cancelled = true;
  },
};

interface OrderBody {
  items?: { variantId: string; quantity?: number; notes?: string | null }[];
}

export const customerHandlers = [
  http.post("*/api/customer/sessions", async ({ request }) => {
    const body = (await request.json()) as { qrToken?: string };
    if (body.qrToken === "qr-busy") return envelope(null, 429, "RATE_LIMITED", "ลองใหม่อีกครั้ง");
    if (body.qrToken !== guestQr) return envelope(null, 404, "QR_INVALID", "QR ไม่ถูกต้อง");
    return envelope(session(displayName), 201);
  }),
  http.get("*/api/customer/session", () => envelope(session(displayName))),
  http.patch("*/api/customer/session", async ({ request }) => {
    const body = (await request.json()) as { displayName: string | null };
    displayName = body.displayName?.trim() ? body.displayName.trim() : null;
    return envelope(session(displayName));
  }),
  http.get("*/api/customer/menu", () => envelope(customerMenu)),
  http.get("*/api/customer/tab", () => envelope(tabOf())),
  http.post("*/api/customer/call-staff", () => envelope({ calledAt: new Date().toISOString() }, 201)),
  http.post("*/api/customer/orders", async ({ request }) => {
    const key = request.headers.get("Idempotency-Key") ?? "";
    const raw = (await request.json()) as OrderBody;
    const body = JSON.stringify(raw);
    const prior = placed.get(key);
    if (prior) return prior.body === body ? envelope(prior.result, 201) : envelope(null, 409, "IDEMPOTENCY_KEY_REUSED", "ส่งอีกครั้งได้");
    const lines = raw.items ?? [];
    // ponytail: a note of ล่มทดสอบ drops the first send of a key, so the e2e can retry it (page.route cannot see service-worker traffic).
    if (key && !dropped.has(key) && lines.some((line) => line.notes === "ล่มทดสอบ")) {
      dropped.add(key);
      return HttpResponse.error();
    }
    // ponytail: a note of หมดทดสอบ stands in for a line sold out between the menu fetch and the send (as in the POS mock).
    const stale = lines.filter((line) => line.notes === "หมดทดสอบ");
    if (stale.length > 0) {
      const details = stale.map((line) => ({ variantId: line.variantId, reason: "sold_out" as const }));
      return envelope({ details }, 409, "ITEM_UNAVAILABLE", "สินค้าหมด");
    }
    const result = { orderId: crypto.randomUUID(), orderNumber: nextNumber, visitId: id(800) };
    tabOrders.push({
      orderNumber: nextNumber++,
      placedAt: new Date().toISOString(),
      mine: true,
      tickets: [{ station: "bar", status: "pending" }],
      lines: (raw.items ?? []).map((line) => variantLine(line.variantId, line.quantity ?? 1)),
    });
    if (key) placed.set(key, { body, result });
    return envelope(result, 201);
  }),
];
