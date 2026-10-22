import type { OrderStatus, Ticket } from "@bar/contracts";
import type { TicketTransition } from "@/lib/api/tickets";

export type ColumnKey = "pending" | "accepted" | "ready" | "issue";
export type StationFilter = "all" | "bar" | "food";

export interface ColumnDef {
  key: ColumnKey;
  label: string;
}

export type CardAction = { kind: TicketTransition; label: string } | { kind: "issue"; label: string };

const pending: ColumnDef = { key: "pending", label: "ใหม่" };
const accepted: ColumnDef = { key: "accepted", label: "กำลังเตรียม" };
const ready: ColumnDef = { key: "ready", label: "พร้อมเสิร์ฟ" };
const issue: ColumnDef = { key: "issue", label: "มีปัญหา" };

export const stationLabel = { bar: "บาร์", food: "ครัว" } as const;

export function columnsFor(kitchenOn: boolean): ColumnDef[] {
  return kitchenOn ? [pending, accepted, ready, issue] : [pending, accepted, issue];
}

export function orderTag(orderNumber: number): string {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

// A ready ticket can outlive the kitchen screen being switched off — keep it visible under กำลังเตรียม.
export function columnOf(status: OrderStatus, kitchenOn: boolean): ColumnKey | null {
  if (status === "sent" || status === "cancelled") return null;
  if (status === "ready" && !kitchenOn) return "accepted";
  return status;
}

export function actionOf(ticket: Ticket, kitchenOn: boolean): CardAction | null {
  switch (ticket.status) {
    case "pending":
      return { kind: "accept", label: "รับออเดอร์" };
    case "accepted":
      return kitchenOn && ticket.seat.kind === "table"
        ? { kind: "ready", label: "พร้อมแล้ว" }
        : { kind: "send", label: "เสิร์ฟแล้ว" };
    case "ready":
      return { kind: "send", label: "เสิร์ฟแล้ว" };
    case "issue":
      return { kind: "issue", label: "จัดการปัญหา" };
    default:
      return null;
  }
}

export function ticketsIn(
  items: readonly Ticket[],
  column: ColumnKey,
  kitchenOn: boolean,
  station: StationFilter,
): Ticket[] {
  return items
    .filter((ticket) => columnOf(ticket.status, kitchenOn) === column)
    // Issues the staff app has not escalated stay with staff (BRIEF-034 Q1 = A).
    .filter((ticket) => ticket.status !== "issue" || ticket.issue?.escalatedAt != null)
    .filter((ticket) => !kitchenOn || station === "all" || ticket.station === station)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}
