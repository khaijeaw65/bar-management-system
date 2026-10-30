import { expect, test } from "vitest";
import { pendingBySeat } from "@/hooks/useTicketBoard";
import { ticket } from "@/app/pos/tables/_components/session.fixture";
import { callReasonText, callTitle, formatCallAge, isGuestOrder, orderTag } from "./alerts";

const at = "2026-10-30T10:00:00.000Z";

test("AC-4: a guest order has no creator; staff orders do", () => {
  expect(isGuestOrder({ createdBy: null })).toBe(true);
  expect(isGuestOrder({ createdBy: { staffId: "x", displayName: "นุ่น" } })).toBe(false);
  expect(orderTag(7)).toBe("#007");
});

test("call text: bill, note, none", () => {
  expect(callTitle("T3", { reason: "bill", note: null })).toBe("T3 เรียกพนักงาน · เช็คบิล");
  expect(callReasonText({ reason: "other", note: " ขอน้ำแข็ง " })).toBe("ขอน้ำแข็ง");
  expect(callReasonText({ reason: "transfer", note: "1240.00" })).toBe("แจ้งโอนแล้ว ฿1,240.00");
  expect(callTitle("T3", { reason: null, note: null })).toBe("T3 เรียกพนักงาน");
});

test("call age", () => {
  const now = Date.parse(at);
  expect(formatCallAge(at, now + 30_000)).toBe("เมื่อกี้");
  expect(formatCallAge(at, now + 3 * 60_000)).toBe("3 นาทีที่แล้ว");
  expect(formatCallAge(at, null)).toBe("เมื่อกี้");
});

test("pending tickets are counted per seat id", () => {
  const seatA = { id: "a", label: "T3", kind: "table" as const };
  const seatB = { id: "b", label: "T2", kind: "table" as const };
  const counts = pendingBySeat([
    ticket("t1", 1, [], { seat: seatA, status: "pending" }),
    ticket("t2", 2, [], { seat: seatA, status: "pending" }),
    ticket("t3", 3, [], { seat: seatA, status: "accepted" }),
    ticket("t4", 4, [], { seat: seatB, status: "ready" }),
  ]);
  expect(counts.get("a")).toBe(2);
  expect(counts.has("b")).toBe(false);
});
