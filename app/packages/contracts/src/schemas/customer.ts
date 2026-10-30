import { z } from 'zod';
import { apiResponseSchema, IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import { KitchenStationSchema, OrderStatusSchema, TableSeatKindSchema } from './enums.js';
import { MenuModifierGroupSchema, MenuWindowSchema, UnavailableReasonSchema } from './menu.js';
import { PlaceOrderItemSchema } from './orders.js';
import { CallStaffReasonSchema } from './visits.js';

// Guest QR session (DR-028). The cookie carries the token; the body never does.
export const CustomerSessionSchema = z.object({
  seat: z.object({
    id: UuidSchema,
    label: z.string(),
    kind: TableSeatKindSchema,
  }),
  visitId: UuidSchema.nullable(),
  displayName: z.string().nullable(),
  expiresAt: IsoDateTimeSchema,
});
export type CustomerSession = z.infer<typeof CustomerSessionSchema>;

export const StartCustomerSessionSchema = z.object({
  qrToken: z.string('ต้องระบุ qrToken').min(1, 'ต้องระบุ qrToken').max(64, 'qrToken ยาวเกินไป'),
});
export type StartCustomerSession = z.infer<typeof StartCustomerSessionSchema>;

// Trimmed, max 30 after trimming (CD-06 R3). An empty name clears it — the server turns '' into null.
export const UpdateCustomerSessionSchema = z.object({
  displayName: z
    .string('ชื่อต้องเป็นข้อความ')
    .trim()
    .max(30, 'ชื่อต้องไม่เกิน 30 ตัวอักษร')
    .nullable(),
});
export type UpdateCustomerSession = z.infer<typeof UpdateCustomerSessionSchema>;

// Slim view of the staff menu: no station, itemType, sortOrder or updatedAt (POS-only).
export const CustomerMenuVariantSchema = z.strictObject({
  id: UuidSchema,
  name: z.string(),
  price: MoneySchema,
  isAvailable: z.boolean(),
  modifierGroups: z.array(MenuModifierGroupSchema),
});
export type CustomerMenuVariant = z.infer<typeof CustomerMenuVariantSchema>;

export const CustomerMenuItemSchema = z.strictObject({
  id: UuidSchema,
  categoryId: UuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.url().nullable(),
  isPromo: z.boolean(),
  basePrice: MoneySchema,
  availableNow: z.boolean(),
  unavailableReason: UnavailableReasonSchema.nullable(),
  windows: z.array(MenuWindowSchema),
  variants: z.array(CustomerMenuVariantSchema),
});
export type CustomerMenuItem = z.infer<typeof CustomerMenuItemSchema>;

export const CustomerMenuCategorySchema = z.strictObject({
  id: UuidSchema,
  name: z.string(),
  sortOrder: z.number().int(),
});
export type CustomerMenuCategory = z.infer<typeof CustomerMenuCategorySchema>;

export const CustomerMenuSchema = z.strictObject({
  categories: z.array(CustomerMenuCategorySchema),
  items: z.array(CustomerMenuItemSchema),
});
export type CustomerMenu = z.infer<typeof CustomerMenuSchema>;

export const CustomerSessionResponseSchema = apiResponseSchema(CustomerSessionSchema);
export type CustomerSessionResponse = z.infer<typeof CustomerSessionResponseSchema>;

export const CustomerMenuResponseSchema = apiResponseSchema(CustomerMenuSchema);
export type CustomerMenuResponse = z.infer<typeof CustomerMenuResponseSchema>;

// Same line shape as the staff order; `orderedByName` is not accepted — the server takes the session's nickname.
export const CustomerPlaceOrderSchema = z.object({
  items: z
    .array(PlaceOrderItemSchema.omit({ orderedByName: true }))
    .min(1, 'ต้องมีอย่างน้อย 1 รายการ')
    .max(50, 'สั่งได้ไม่เกิน 50 รายการ'),
});
export type CustomerPlaceOrder = z.infer<typeof CustomerPlaceOrderSchema>;

export const CustomerPlaceOrderResultSchema = z.strictObject({
  orderId: UuidSchema,
  orderNumber: z.number().int().positive(),
  visitId: UuidSchema,
});
export type CustomerPlaceOrderResult = z.infer<typeof CustomerPlaceOrderResultSchema>;

// Running tab (BRIEF-048): built from snapshots, never carries staff or other sessions' identities.
export const CustomerTabLineSchema = z.strictObject({
  itemName: z.string(),
  variantName: z.string(),
  modifiers: z.array(z.string()),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  lineTotal: MoneySchema,
  orderedByName: z.string().nullable(),
  cancelled: z.boolean(),
});
export type CustomerTabLine = z.infer<typeof CustomerTabLineSchema>;

export const CustomerTabTicketSchema = z.strictObject({
  station: KitchenStationSchema,
  status: OrderStatusSchema,
});
export type CustomerTabTicket = z.infer<typeof CustomerTabTicketSchema>;

export const CustomerTabOrderSchema = z.strictObject({
  orderNumber: z.number().int().positive(),
  placedAt: IsoDateTimeSchema,
  mine: z.boolean(),
  tickets: z.array(CustomerTabTicketSchema),
  lines: z.array(CustomerTabLineSchema),
});
export type CustomerTabOrder = z.infer<typeof CustomerTabOrderSchema>;

export const CustomerTabSchema = z.strictObject({
  visitId: UuidSchema.nullable(),
  orders: z.array(CustomerTabOrderSchema),
  total: MoneySchema,
  asOf: IsoDateTimeSchema,
});
export type CustomerTab = z.infer<typeof CustomerTabSchema>;

export const CustomerCallStaffSchema = z.object({
  reason: CallStaffReasonSchema.optional(),
  note: z.string('หมายเหตุต้องเป็นข้อความ').trim().max(100, 'หมายเหตุยาวเกินไป').optional(),
});
export type CustomerCallStaff = z.infer<typeof CustomerCallStaffSchema>;

export const CallStaffResultSchema = z.strictObject({ calledAt: IsoDateTimeSchema });
export type CallStaffResult = z.infer<typeof CallStaffResultSchema>;

export const AcknowledgeCallResultSchema = z.strictObject({ ok: z.literal(true) });
export type AcknowledgeCallResult = z.infer<typeof AcknowledgeCallResultSchema>;
