import type { Order, StaffCall } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";

// created_by is NULL only for a guest order from the QR (BRIEF-048).
export function isGuestOrder(order: Pick<Order, "createdBy">): boolean {
  return order.createdBy === null;
}

export function orderTag(orderNumber: number): string {
  return `#${String(orderNumber).padStart(3, "0")}`;
}

export function callReasonText(call: Pick<StaffCall, "reason" | "note">): string | null {
  if (call.reason === "bill") return "เช็คบิล";
  // The note is the pending payment's amount as a Money string (BRIEF-052).
  if (call.reason === "transfer") return call.note ? `แจ้งโอนแล้ว ${formatTHB(call.note)}` : "แจ้งโอนแล้ว";
  return call.note?.trim() || null;
}

export function callTitle(label: string, call: Pick<StaffCall, "reason" | "note">): string {
  const reason = callReasonText(call);
  return reason ? `${label} เรียกพนักงาน · ${reason}` : `${label} เรียกพนักงาน`;
}

export function formatCallAge(calledAt: string, now: number | null): string {
  const minutes = now === null ? 0 : Math.floor((now - Date.parse(calledAt)) / 60_000);
  return minutes < 1 ? "เมื่อกี้" : `${minutes} นาทีที่แล้ว`;
}
