import { toast } from "@heroui/react";

let sentNumber: number | null = null;

/** The send handler leaves the number; the tab screen raises the Toast once it is mounted, after the route-change clear. */
export function announceSent(orderNumber: number): void {
  sentNumber = orderNumber;
}

export function raiseSentToast(): void {
  if (sentNumber === null) return;
  toast.success(`ส่งออเดอร์แล้ว · #${String(sentNumber).padStart(3, "0")}`);
  sentNumber = null;
}
