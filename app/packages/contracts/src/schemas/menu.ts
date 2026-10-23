import { z } from 'zod';
import { apiResponseSchema, IsoDateTimeSchema, MoneySchema, UuidSchema } from './common.js';
import { ItemTypeSchema, KitchenStationSchema, OrderStatusSchema } from './enums.js';

export const UnavailableReasonSchema = z.enum(['sold_out', 'out_of_window']);
export type UnavailableReason = z.infer<typeof UnavailableReasonSchema>;

export const MenuWindowSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(1).max(7)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
export type MenuWindow = z.infer<typeof MenuWindowSchema>;

export const MenuModifierOptionSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  priceDelta: MoneySchema,
  isAvailable: z.boolean(),
});
export type MenuModifierOption = z.infer<typeof MenuModifierOptionSchema>;

export const MenuModifierGroupSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  isRequired: z.boolean(),
  minSelect: z.number().int(),
  maxSelect: z.number().int(),
  options: z.array(MenuModifierOptionSchema),
});
export type MenuModifierGroup = z.infer<typeof MenuModifierGroupSchema>;

export const MenuItemVariantSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  price: MoneySchema,
  isAvailable: z.boolean(),
  modifierGroups: z.array(MenuModifierGroupSchema),
});
export type MenuItemVariant = z.infer<typeof MenuItemVariantSchema>;

// `station` is menu_item.kitchen_tag. Null only when itemType is charge.
export const MenuItemSchema = z.object({
  id: UuidSchema,
  categoryId: UuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.null(),
  itemType: ItemTypeSchema,
  station: KitchenStationSchema.nullable(),
  isPromo: z.boolean(),
  basePrice: MoneySchema,
  sortOrder: z.number().int(),
  availableNow: z.boolean(),
  unavailableReason: UnavailableReasonSchema.nullable(),
  windows: z.array(MenuWindowSchema),
  variants: z.array(MenuItemVariantSchema),
  // Sent back on PATCH /menu/items/:id; an older value → 409 MENU_ITEM_STALE (BRIEF-038 Q1).
  updatedAt: IsoDateTimeSchema,
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuCategorySchema = z.object({
  id: UuidSchema,
  name: z.string(),
  sortOrder: z.number().int(),
});
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const MenuItemListSchema = z.object({
  items: z.array(MenuItemSchema),
});
export type MenuItemList = z.infer<typeof MenuItemListSchema>;

export const MenuCategoryListSchema = z.object({
  items: z.array(MenuCategorySchema),
});
export type MenuCategoryList = z.infer<typeof MenuCategoryListSchema>;

export const VenueSettingsSchema = z.object({
  name: z.string(),
  slug: z.string(),
  kitchenDisplayEnabled: z.boolean(),
  businessDayCutoff: z.string().regex(/^\d{2}:\d{2}$/),
  counterQrEnabled: z.boolean(),
});
export type VenueSettings = z.infer<typeof VenueSettingsSchema>;

export const MenuItemsQuerySchema = z.object({
  categoryId: z.uuid('รหัสหมวดไม่ถูกต้อง').optional(),
  available: z.literal('true', 'ใช้ได้เฉพาะ available=true').optional(),
});
export type MenuItemsQuery = z.infer<typeof MenuItemsQuerySchema>;

export const MenuItemListResponseSchema = apiResponseSchema(MenuItemListSchema);
export type MenuItemListResponse = z.infer<typeof MenuItemListResponseSchema>;

export const MenuCategoryListResponseSchema = apiResponseSchema(
  MenuCategoryListSchema,
);
export type MenuCategoryListResponse = z.infer<
  typeof MenuCategoryListResponseSchema
>;

export const AvailabilityTicketSchema = z.object({
  ticketId: UuidSchema,
  orderNumber: z.number().int().positive(),
  seatLabel: z.string(),
  itemCount: z.number().int().positive(),
  ticketStatus: OrderStatusSchema,
});
export type AvailabilityTicket = z.infer<typeof AvailabilityTicketSchema>;

export const NotVoidedTicketSchema = z.object({
  ticketId: UuidSchema,
  orderNumber: z.number().int().positive(),
  seatLabel: z.string(),
  itemCount: z.number().int().positive(),
  reason: z.enum(['in_progress', 'payment_pending']),
});
export type NotVoidedTicket = z.infer<typeof NotVoidedTicketSchema>;

export const MarkAvailabilityResultSchema = z.object({
  item: MenuItemSchema,
  autoVoided: z.array(AvailabilityTicketSchema),
  notVoided: z.array(NotVoidedTicketSchema),
});
export type MarkAvailabilityResult = z.infer<typeof MarkAvailabilityResultSchema>;

export const MenuItemResponseSchema = apiResponseSchema(MenuItemSchema);
export type MenuItemResponse = z.infer<typeof MenuItemResponseSchema>;

export const VenueSettingsResponseSchema =
  apiResponseSchema(VenueSettingsSchema);
export type VenueSettingsResponse = z.infer<typeof VenueSettingsResponseSchema>;
