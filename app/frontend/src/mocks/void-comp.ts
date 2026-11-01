import type { Order, OrderLine, Ticket } from "@bar/contracts";
import { http, HttpResponse } from "msw";

function envelope(data: unknown, status = 200, code = "", message = "success") {
  return HttpResponse.json({ status, code, message, data }, { status });
}

function isStaffRole(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem("pos-mock-role") === "staff";
}

export interface VoidCompStore {
  findOrderLine(itemId: string): {
    order: Order;
    ticket: Ticket;
    line: OrderLine;
    visitId: string;
  } | null;
  isPaymentInFlight(visitId: string): boolean;
  isVisitPaid(visitId: string): boolean;
  recalculate(visitId: string): void;
}

export function createVoidCompHandlers(store: VoidCompStore) {
  return [
    http.post("*/api/order-items/:id/void", async ({ params, request }) => {
      const itemId = String(params.id);
      const body = (await request.json().catch(() => ({}))) as {
        reason?: string;
        note?: string;
        pin?: string;
      };

      if (!body.reason) {
        return envelope(null, 400, "VALIDATION_ERROR", "กรุณาระบุเหตุผล");
      }
      if (body.reason === "other" && (!body.note || body.note.trim() === "")) {
        return envelope(null, 400, "VALIDATION_ERROR", "กรุณาระบุเหตุผลเพิ่มเติม");
      }

      const isStaff = isStaffRole();
      if (isStaff || body.pin !== undefined) {
        if (!body.pin || body.pin !== "1234") {
          return envelope(null, 422, "PIN_INVALID", "PIN ไม่ถูกต้อง");
        }
      }

      const match = store.findOrderLine(itemId);
      if (!match) {
        return envelope(null, 404, "NOT_FOUND", "ไม่พบรายการ");
      }

      if (store.isPaymentInFlight(match.visitId)) {
        return envelope(null, 409, "PAYMENT_IN_FLIGHT", "มีการชำระเงินค้างอยู่ ยกเลิก/Comp ไม่ได้");
      }
      if (store.isVisitPaid(match.visitId)) {
        return envelope(null, 409, "VISIT_PAID", "ชำระเงินแล้ว ยกเลิก/Comp ไม่ได้");
      }

      const now = new Date().toISOString();
      match.line.cancelledAt = now;
      match.line.cancellation = {
        at: now,
        reason: body.reason,
        by: !isStaff && !body.pin
          ? null
          : { staffId: "11111111-1111-4111-8111-111111111111", displayName: "ผู้จัดการ" },
        system: false,
      };

      store.recalculate(match.visitId);
      return envelope(match.line);
    }),

    http.post("*/api/order-items/:id/comp", async ({ params, request }) => {
      const itemId = String(params.id);
      const body = (await request.json().catch(() => ({}))) as {
        reason?: string;
        note?: string;
        pin?: string;
      };

      if (!body.reason) {
        return envelope(null, 400, "VALIDATION_ERROR", "กรุณาระบุเหตุผล");
      }
      if (body.reason === "other" && (!body.note || body.note.trim() === "")) {
        return envelope(null, 400, "VALIDATION_ERROR", "กรุณาระบุเหตุผลเพิ่มเติม");
      }

      const isStaff = isStaffRole();
      if (isStaff || body.pin !== undefined) {
        if (!body.pin || body.pin !== "1234") {
          return envelope(null, 422, "PIN_INVALID", "PIN ไม่ถูกต้อง");
        }
      }

      const match = store.findOrderLine(itemId);
      if (!match) {
        return envelope(null, 404, "NOT_FOUND", "ไม่พบรายการ");
      }

      if (store.isPaymentInFlight(match.visitId)) {
        return envelope(null, 409, "PAYMENT_IN_FLIGHT", "มีการชำระเงินค้างอยู่ ยกเลิก/Comp ไม่ได้");
      }
      if (store.isVisitPaid(match.visitId)) {
        return envelope(null, 409, "VISIT_PAID", "ชำระเงินแล้ว ยกเลิก/Comp ไม่ได้");
      }

      match.line.lineTotal = "0.00";
      store.recalculate(match.visitId);
      return envelope(match.line);
    }),
  ];
}
