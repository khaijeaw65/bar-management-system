import {
  CreateSeatRequestSchema,
  ReorderSeatsRequestSchema,
  UpdateSeatRequestSchema,
  type CreateSeatRequest,
  type ReorderSeatsRequest,
  type SeatAdmin,
  type UpdateSeatRequest,
} from "@bar/contracts";
import { http, HttpResponse } from "msw";
import { mockRoleCan } from "./permissions";

function envelope(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json({ status, code, message, data }, { status });
}

function denied() {
  return envelope({ missing: ["tables:manage"] }, 403, "FORBIDDEN", "ไม่มีสิทธิ์");
}

const initialSeats = (): SeatAdmin[] => [
  {
    id: "10000000-0000-4000-8000-000000000001",
    label: "C1",
    kind: "counter",
    sortOrder: 0,
    isActive: true,
    qrToken: "mock-qr-token-c1-000000000000000000000000000000",
    hasLiveVisit: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    label: "C4",
    kind: "counter",
    sortOrder: 1,
    isActive: true,
    qrToken: "mock-qr-token-c4-000000000000000000000000000000",
    hasLiveVisit: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    label: "T2",
    kind: "table",
    sortOrder: 0,
    isActive: true,
    qrToken: "mock-qr-token-t2-000000000000000000000000000000",
    hasLiveVisit: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    label: "T3",
    kind: "table",
    sortOrder: 1,
    isActive: true,
    qrToken: "mock-qr-token-t3-000000000000000000000000000000",
    hasLiveVisit: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    label: "T5",
    kind: "table",
    sortOrder: 2,
    isActive: true,
    qrToken: "mock-qr-token-t5-000000000000000000000000000000",
    hasLiveVisit: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    label: "T6",
    kind: "table",
    sortOrder: 3,
    isActive: true,
    qrToken: "mock-qr-token-t6-000000000000000000000000000000",
    hasLiveVisit: false,
  },
];

let seats = initialSeats();
let nextSeatNum = 10;

export function resetTablesAdminMock(): void {
  seats = initialSeats();
  nextSeatNum = 10;
}

export const tablesAdminHandlers = [
  http.get("*/api/tables/manage", () => {
    if (!mockRoleCan("tables:manage")) return denied();
    return envelope({ items: seats });
  }),

  http.post("*/api/tables", async ({ request }) => {
    if (!mockRoleCan("tables:manage")) return denied();
    const raw = (await request.json()) as unknown;
    const parsed = CreateSeatRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return envelope(null, 400, "VALIDATION_ERROR", "ข้อมูลไม่ถูกต้อง");
    }
    const body: CreateSeatRequest = parsed.data;
    const trimmed = body.label.trim();

    // Check duplicate label among active seats
    const duplicate = seats.some(
      (s) => s.isActive && s.label.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      return envelope(null, 409, "SEAT_LABEL_TAKEN", "มีชื่อนี้แล้ว");
    }

    const sectionSeats = seats.filter((s) => s.kind === body.kind);
    const maxSortOrder = sectionSeats.reduce((max, s) => Math.max(max, s.sortOrder), -1);

    const newSeat: SeatAdmin = {
      id: `10000000-0000-4000-8000-${String(nextSeatNum++).padStart(12, "0")}`,
      label: trimmed,
      kind: body.kind,
      sortOrder: maxSortOrder + 1,
      isActive: true,
      qrToken: `mock-qr-token-${trimmed.toLowerCase()}-${Date.now()}`,
      hasLiveVisit: false,
    };
    seats.push(newSeat);
    return envelope(newSeat, 201);
  }),

  http.patch("*/api/tables/:id", async ({ params, request }) => {
    if (!mockRoleCan("tables:manage")) return denied();
    const id = String(params.id);
    const index = seats.findIndex((s) => s.id === id);
    if (index === -1) {
      return envelope(null, 404, "NOT_FOUND", "ไม่พบโต๊ะ");
    }

    const raw = (await request.json()) as unknown;
    const parsed = UpdateSeatRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return envelope(null, 400, "VALIDATION_ERROR", "ข้อมูลไม่ถูกต้อง");
    }
    const body: UpdateSeatRequest = parsed.data;

    if (body.label !== undefined) {
      const trimmed = body.label.trim();
      const duplicate = seats.some(
        (s) => s.id !== id && s.isActive && s.label.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) {
        return envelope(null, 409, "SEAT_LABEL_TAKEN", "มีชื่อนี้แล้ว");
      }
      seats[index] = { ...seats[index], label: trimmed };
    }

    if (body.kind !== undefined && body.kind !== seats[index].kind) {
      const targetSectionSeats = seats.filter((s) => s.kind === body.kind);
      const maxSortOrder = targetSectionSeats.reduce((max, s) => Math.max(max, s.sortOrder), -1);
      seats[index] = {
        ...seats[index],
        kind: body.kind,
        sortOrder: maxSortOrder + 1,
      };
    }

    return envelope(seats[index]);
  }),

  http.put("*/api/tables/order", async ({ request }) => {
    if (!mockRoleCan("tables:manage")) return denied();
    const raw = (await request.json()) as unknown;
    const parsed = ReorderSeatsRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return envelope(null, 400, "VALIDATION_ERROR", "ข้อมูลไม่ถูกต้อง");
    }
    const body: ReorderSeatsRequest = parsed.data;

    const idToOrder = new Map<string, number>();
    body.ids.forEach((id, idx) => idToOrder.set(id, idx));

    seats = seats.map((s) => {
      if (s.kind === body.kind && idToOrder.has(s.id)) {
        return { ...s, sortOrder: idToOrder.get(s.id)! };
      }
      return s;
    });

    return envelope({ items: seats });
  }),

  http.post("*/api/tables/:id/deactivate", ({ params }) => {
    if (!mockRoleCan("tables:manage")) return denied();
    const id = String(params.id);
    const index = seats.findIndex((s) => s.id === id);
    if (index === -1) {
      return envelope(null, 404, "NOT_FOUND", "ไม่พบโต๊ะ");
    }

    if (seats[index].hasLiveVisit) {
      return envelope(null, 409, "SEAT_IN_USE", "มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน");
    }

    seats[index] = { ...seats[index], isActive: false };
    return envelope(seats[index]);
  }),

  http.post("*/api/tables/:id/activate", ({ params }) => {
    if (!mockRoleCan("tables:manage")) return denied();
    const id = String(params.id);
    const index = seats.findIndex((s) => s.id === id);
    if (index === -1) {
      return envelope(null, 404, "NOT_FOUND", "ไม่พบโต๊ะ");
    }

    seats[index] = { ...seats[index], isActive: true };
    return envelope(seats[index]);
  }),

  http.post("*/api/tables/:id/qr/regenerate", ({ params }) => {
    if (!mockRoleCan("tables:manage")) return denied();
    const id = String(params.id);
    const index = seats.findIndex((s) => s.id === id);
    if (index === -1) {
      return envelope(null, 404, "NOT_FOUND", "ไม่พบโต๊ะ");
    }

    const newQrToken = `mock-qr-token-${seats[index].label.toLowerCase()}-${Date.now()}`;
    seats[index] = { ...seats[index], qrToken: newQrToken };
    return envelope({ qrToken: newQrToken });
  }),
];
