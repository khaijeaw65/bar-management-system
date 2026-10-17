import { z } from 'zod';
import { apiResponseSchema, listSchema, MoneySchema, UuidSchema } from './common.js';
import { ItemTypeSchema } from './enums.js';

export const MenuCategorySchema = z.object({
  id: UuidSchema,
  name: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

// D4: id, name, price, isAvailable.
export const MenuItemVariantSchema = z.object({
  id: UuidSchema,
  name: z.string(),
  price: MoneySchema,
  isAvailable: z.boolean(),
});
export type MenuItemVariant = z.infer<typeof MenuItemVariantSchema>;

export const MenuItemSummarySchema = z.object({
  id: UuidSchema,
  categoryId: UuidSchema,
  name: z.string(),
  basePrice: MoneySchema,
  isAvailable: z.boolean(),
  itemType: ItemTypeSchema,
  sortOrder: z.number().int(),
  variants: z.array(MenuItemVariantSchema),
});
export type MenuItemSummary = z.infer<typeof MenuItemSummarySchema>;

export const MenuItemListResponseSchema = apiResponseSchema(
  listSchema(MenuItemSummarySchema),
);
export type MenuItemListResponse = z.infer<typeof MenuItemListResponseSchema>;

export const MenuCategoryListResponseSchema = apiResponseSchema(
  listSchema(MenuCategorySchema),
);
export type MenuCategoryListResponse = z.infer<
  typeof MenuCategoryListResponseSchema
>;
