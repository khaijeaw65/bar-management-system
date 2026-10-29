import { z } from 'zod';
import { apiResponseSchema, IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import { TableSeatKindSchema } from './enums.js';
import { MenuModifierGroupSchema, MenuWindowSchema, UnavailableReasonSchema } from './menu.js';

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
