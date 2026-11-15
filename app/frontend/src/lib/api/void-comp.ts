import { OrderLineSchema, type OrderLine } from "@bar/contracts";
import { z } from "zod";
import { apiPost } from "./client";

export const AdjustmentReasonSchema = z.enum([
  "out_of_stock",
  "wrong_order",
  "guest_changed",
  "spoiled",
  "special_service",
  "other",
]);

export type AdjustmentReason = z.infer<typeof AdjustmentReasonSchema>;

export const ADJUSTMENT_REASONS: readonly { value: AdjustmentReason; label: string }[] = [
  { value: "out_of_stock", label: "ของหมด" },
  { value: "wrong_order", label: "สั่งผิด" },
  { value: "guest_changed", label: "ลูกค้าเปลี่ยนใจ" },
  { value: "spoiled", label: "ของเสีย" },
  { value: "special_service", label: "บริการพิเศษ" },
  { value: "other", label: "อื่นๆ" },
] as const;

export const VoidCompRequestSchema = z.object({
  reason: AdjustmentReasonSchema,
  note: z.string().max(100).optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN ต้องเป็นตัวเลข 4 หลัก").optional(),
});

export type VoidCompRequest = z.infer<typeof VoidCompRequestSchema>;

export async function voidOrderItem(itemId: string, body: VoidCompRequest): Promise<OrderLine> {
  return await apiPost(`/order-items/${itemId}/void`, body, OrderLineSchema);
}

export async function compOrderItem(itemId: string, body: VoidCompRequest): Promise<OrderLine> {
  return await apiPost(`/order-items/${itemId}/comp`, body, OrderLineSchema);
}
