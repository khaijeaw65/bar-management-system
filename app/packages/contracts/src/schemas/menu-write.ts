import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { ItemTypeSchema, KitchenStationSchema } from './enums.js';

const nameField = (label: string) =>
  z.string().trim().min(1, `กรุณากรอก${label}`).max(200, `${label}ยาวเกิน 200 ตัวอักษร`);

// DECIMAL(10,2): at most 8 digits before the point (DR-004 money string).
export const MenuPriceSchema = z
  .string()
  .regex(/^\d{1,8}\.\d{2}$/, 'ราคาต้องเป็นตัวเลขทศนิยม 2 ตำแหน่ง เช่น 120.00');

export const MenuVariantInputSchema = z.object({
  // PATCH only: an existing variant of this item. Omitted → a new variant.
  id: UuidSchema.optional(),
  name: nameField('ชื่อตัวเลือกราคา'),
  price: MenuPriceSchema,
});
export type MenuVariantInput = z.infer<typeof MenuVariantInputSchema>;

const itemFields = {
  categoryId: UuidSchema,
  name: nameField('ชื่อเมนู'),
  description: z.string().trim().max(1000, 'คำอธิบายยาวเกิน 1000 ตัวอักษร').nullable().optional(),
  itemType: ItemTypeSchema,
  station: KitchenStationSchema.nullable(),
  isPromo: z.boolean(),
  variants: z.array(MenuVariantInputSchema).min(1, 'ต้องมีราคาอย่างน้อย 1 แบบ').max(20),
  modifierGroupIds: z.array(UuidSchema).max(20).optional(),
};

interface ItemShape {
  itemType: z.infer<typeof ItemTypeSchema>;
  station: z.infer<typeof KitchenStationSchema> | null;
  variants: MenuVariantInput[];
  modifierGroupIds?: string[];
}

// DR-012 station rule, recipe deferred to S2 (CD-12 editor·6), no duplicate ids.
function checkItemShape(value: ItemShape, ctx: z.RefinementCtx): void {
  if (value.itemType === 'recipe') {
    ctx.addIssue({ code: 'custom', path: ['itemType'], message: 'เมนูแบบสูตรยังไม่เปิดใช้' });
  }
  if (value.itemType === 'charge' && value.station !== null) {
    ctx.addIssue({ code: 'custom', path: ['station'], message: 'ค่าบริการต้องไม่มีสถานี' });
  }
  if (value.itemType !== 'charge' && value.station === null) {
    ctx.addIssue({ code: 'custom', path: ['station'], message: 'กรุณาเลือกสถานี (บาร์หรือครัว)' });
  }
  const variantIds = value.variants.flatMap((variant) => (variant.id ? [variant.id] : []));
  if (new Set(variantIds).size !== variantIds.length) {
    ctx.addIssue({ code: 'custom', path: ['variants'], message: 'ตัวเลือกราคาซ้ำกัน' });
  }
  const groupIds = value.modifierGroupIds ?? [];
  if (new Set(groupIds).size !== groupIds.length) {
    ctx.addIssue({ code: 'custom', path: ['modifierGroupIds'], message: 'กลุ่มตัวเลือกซ้ำกัน' });
  }
}

export const CreateMenuItemSchema = z
  .object(itemFields)
  .superRefine((value, ctx) => {
    checkItemShape(value, ctx);
    if (value.variants.some((variant) => variant.id !== undefined)) {
      ctx.addIssue({ code: 'custom', path: ['variants'], message: 'เมนูใหม่ไม่มีรหัสตัวเลือกราคา' });
    }
  });
export type CreateMenuItem = z.infer<typeof CreateMenuItemSchema>;

// Whole form, like create. Variants are the new active set: listed ids are kept, missing ones
// are deactivated (never deleted). modifierGroupIds omitted → the current links stay.
export const UpdateMenuItemSchema = z
  .object({ ...itemFields, updatedAt: IsoDateTimeSchema })
  .superRefine(checkItemShape);
export type UpdateMenuItem = z.infer<typeof UpdateMenuItemSchema>;

export const CreateMenuCategorySchema = z.object({ name: nameField('ชื่อหมวด') });
export type CreateMenuCategory = z.infer<typeof CreateMenuCategorySchema>;

export const UpdateMenuCategorySchema = z
  .object({ name: nameField('ชื่อหมวด'), isActive: z.boolean() })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'ต้องระบุอย่างน้อยหนึ่งค่า');
export type UpdateMenuCategory = z.infer<typeof UpdateMenuCategorySchema>;

export const ReorderMenuCategoriesSchema = z
  .object({ ids: z.array(UuidSchema).min(1).max(200) })
  .refine((value) => new Set(value.ids).size === value.ids.length, {
    path: ['ids'],
    message: 'หมวดซ้ำกัน',
  });
export type ReorderMenuCategories = z.infer<typeof ReorderMenuCategoriesSchema>;

export const OkSchema = z.object({ ok: z.literal(true) });
export type Ok = z.infer<typeof OkSchema>;
