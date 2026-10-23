import { z } from 'zod';
import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { ItemTypeSchema, KitchenStationSchema } from './enums.js';
import { MenuModifierGroupSchema } from './menu.js';

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

// Presigned POST (DR-020): S3 itself enforces the type and the 1 byte … 5 MB range.
export const ImageContentTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp'], 'รองรับเฉพาะรูป JPG, PNG หรือ WebP');
export type ImageContentType = z.infer<typeof ImageContentTypeSchema>;

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const CreateImageUploadUrlSchema = z.object({ contentType: ImageContentTypeSchema });
export type CreateImageUploadUrl = z.infer<typeof CreateImageUploadUrlSchema>;

export const ImageUploadUrlSchema = z.object({
  url: z.url(),
  // Form fields to send before the file, in this order; the file field comes last.
  fields: z.record(z.string(), z.string()),
  // `tmp/<uuid>.<ext>` — pass it as `imageKey` when saving the item.
  key: z.string(),
  expiresAt: IsoDateTimeSchema,
});
export type ImageUploadUrl = z.infer<typeof ImageUploadUrlSchema>;

const itemFields = {
  categoryId: UuidSchema,
  name: nameField('ชื่อเมนู'),
  description: z.string().trim().max(1000, 'คำอธิบายยาวเกิน 1000 ตัวอักษร').nullable().optional(),
  itemType: ItemTypeSchema,
  station: KitchenStationSchema.nullable(),
  isPromo: z.boolean(),
  variants: z.array(MenuVariantInputSchema).min(1, 'ต้องมีราคาอย่างน้อย 1 แบบ').max(20),
  modifierGroupIds: z.array(UuidSchema).max(20).optional(),
  // Create: omitted / null = no photo; a `tmp/…` key from image-upload-url attaches it.
  // PATCH: omitted = keep, null = remove, `tmp/…` = replace, the current key = keep (BRIEF-039).
  imageKey: z.string().max(500).nullable().optional(),
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

// Add-on groups (BRIEF-044). The option list of a write is the new active set (like variants).
const modifierOptionInput = z.object({
  // PATCH only: an existing option of this group. Omitted → a new option.
  id: UuidSchema.optional(),
  name: nameField('ชื่อตัวเลือก'),
  priceDelta: MenuPriceSchema,
});

const modifierGroupFields = {
  name: nameField('ชื่อกลุ่ม'),
  isRequired: z.boolean(),
  minSelect: z.number().int().min(0).max(20),
  maxSelect: z.number().int().min(1).max(20),
};

const optionList = <T extends z.ZodType>(option: T) =>
  z.array(option).min(1, 'ต้องมีตัวเลือกอย่างน้อย 1 ตัว').max(50);

interface GroupShape {
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: Array<z.infer<typeof modifierOptionInput>>;
}

// CD-12 R7-4. `options` is the active set, so max is bounded by its length.
function checkGroupShape(value: GroupShape, ctx: z.RefinementCtx): void {
  if (value.isRequired && value.minSelect < 1) {
    ctx.addIssue({ code: 'custom', path: ['minSelect'], message: 'กลุ่มที่บังคับเลือกต้องเลือกอย่างน้อย 1' });
  }
  if (!value.isRequired && value.minSelect !== 0) {
    ctx.addIssue({ code: 'custom', path: ['minSelect'], message: 'กลุ่มที่ไม่บังคับต้องเลือกขั้นต่ำ 0' });
  }
  if (value.maxSelect < value.minSelect) {
    ctx.addIssue({ code: 'custom', path: ['maxSelect'], message: 'เลือกสูงสุดต้องไม่น้อยกว่าขั้นต่ำ' });
  }
  if (value.maxSelect > value.options.length) {
    ctx.addIssue({ code: 'custom', path: ['maxSelect'], message: 'เลือกสูงสุดต้องไม่เกินจำนวนตัวเลือก' });
  }
  const ids = value.options.flatMap((option) => (option.id ? [option.id] : []));
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: 'custom', path: ['options'], message: 'ตัวเลือกซ้ำกัน' });
  }
}

export const CreateModifierGroupSchema = z
  .object({ ...modifierGroupFields, options: optionList(modifierOptionInput.omit({ id: true })) })
  .superRefine(checkGroupShape);
export type CreateModifierGroup = z.infer<typeof CreateModifierGroupSchema>;

export const UpdateModifierGroupSchema = z
  .object({ ...modifierGroupFields, options: optionList(modifierOptionInput) })
  .superRefine(checkGroupShape);
export type UpdateModifierGroup = z.infer<typeof UpdateModifierGroupSchema>;

// Back-office view: options include switched-off ones (`isAvailable: false`).
export const ModifierGroupAdminSchema = MenuModifierGroupSchema.extend({
  // Menu items whose active variants link the group (CD-12 "ใช้กับ n เมนู").
  usedByItems: z.number().int().min(0),
});
export type ModifierGroupAdmin = z.infer<typeof ModifierGroupAdminSchema>;

export const ModifierGroupAdminListSchema = z.object({ items: z.array(ModifierGroupAdminSchema) });
export type ModifierGroupAdminList = z.infer<typeof ModifierGroupAdminListSchema>;

export const OkSchema = z.object({ ok: z.literal(true) });
export type Ok = z.infer<typeof OkSchema>;
