import { MenuCategorySchema, MenuCategoriesQuerySchema, MenuItemSchema, MenuItemsQuerySchema } from './menu.js';
import {
  CreateImageUploadUrlSchema,
  CreateMenuItemSchema,
  ReorderMenuCategoriesSchema,
  UpdateMenuCategorySchema,
  UpdateMenuItemSchema,
} from './menu-write.js';

const CATEGORY = '11111111-1111-4111-8111-111111111111';
const VARIANT = '22222222-2222-4222-8222-222222222222';

const gin = {
  categoryId: CATEGORY,
  name: '  จินโทนิค ',
  itemType: 'simple',
  station: 'bar',
  isPromo: false,
  variants: [
    { name: 'แก้ว', price: '180.00' },
    { name: 'ดับเบิล', price: '260.00' },
  ],
};

function issues(result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[] }> } }): string[] {
  return (result.error?.issues ?? []).map((issue) => issue.path.join('.'));
}

describe('CreateMenuItemSchema', () => {
  it('accepts a bar item with two variants and trims the name', () => {
    const parsed = CreateMenuItemSchema.parse(gin);
    expect(parsed.name).toBe('จินโทนิค');
    expect(parsed.variants).toHaveLength(2);
  });

  it('accepts a charge item without a station (DR-012)', () => {
    const charge = { ...gin, itemType: 'charge', station: null, variants: [{ name: 'ต่อคน', price: '0.00' }] };
    expect(CreateMenuItemSchema.safeParse(charge).success).toBe(true);
  });

  it('rejects a charge item with a station', () => {
    expect(issues(CreateMenuItemSchema.safeParse({ ...gin, itemType: 'charge' }))).toEqual(['station']);
  });

  it('rejects a simple item without a station', () => {
    expect(issues(CreateMenuItemSchema.safeParse({ ...gin, station: null }))).toEqual(['station']);
  });

  it('rejects a recipe item in S1', () => {
    expect(issues(CreateMenuItemSchema.safeParse({ ...gin, itemType: 'recipe' }))).toEqual(['itemType']);
  });

  it('rejects an item without variants', () => {
    expect(issues(CreateMenuItemSchema.safeParse({ ...gin, variants: [] }))).toEqual(['variants']);
  });

  it.each(['-1.00', '180', '180.5', '1.000', '123456789.00'])('rejects price %s', (price) => {
    const result = CreateMenuItemSchema.safeParse({ ...gin, variants: [{ name: 'แก้ว', price }] });
    expect(result.success).toBe(false);
  });

  it('rejects a variant id on create and duplicate modifier groups', () => {
    expect(
      issues(CreateMenuItemSchema.safeParse({ ...gin, variants: [{ id: VARIANT, name: 'แก้ว', price: '1.00' }] })),
    ).toEqual(['variants']);
    expect(
      issues(CreateMenuItemSchema.safeParse({ ...gin, modifierGroupIds: [CATEGORY, CATEGORY] })),
    ).toEqual(['modifierGroupIds']);
  });
});

describe('UpdateMenuItemSchema', () => {
  const update = { ...gin, updatedAt: '2026-10-23T10:00:00.000Z' };

  it('accepts kept and new variants', () => {
    const body = { ...update, variants: [{ id: VARIANT, name: 'แก้ว', price: '190.00' }, { name: 'เหยือก', price: '590.00' }] };
    expect(UpdateMenuItemSchema.safeParse(body).success).toBe(true);
  });

  it('requires updatedAt and rejects duplicate variant ids', () => {
    expect(issues(UpdateMenuItemSchema.safeParse(gin))).toEqual(['updatedAt']);
    const twice = { id: VARIANT, name: 'แก้ว', price: '1.00' };
    expect(issues(UpdateMenuItemSchema.safeParse({ ...update, variants: [twice, twice] }))).toEqual(['variants']);
  });
});

describe('category schemas', () => {
  it('needs at least one field on PATCH', () => {
    expect(UpdateMenuCategorySchema.safeParse({}).success).toBe(false);
    expect(UpdateMenuCategorySchema.parse({ isActive: false })).toEqual({ isActive: false });
  });

  it('rejects a reorder with the same id twice', () => {
    expect(ReorderMenuCategoriesSchema.safeParse({ ids: [CATEGORY, CATEGORY] }).success).toBe(false);
    expect(ReorderMenuCategoriesSchema.safeParse({ ids: [CATEGORY] }).success).toBe(true);
  });
});

describe('imageKey', () => {
  const tmp = 'tmp/5b0c3f1e-8d2a-4c47-9a51-0e6f2b7d3c18.jpg';

  it('is optional on create and update, and may be null', () => {
    expect(CreateMenuItemSchema.parse(gin).imageKey).toBeUndefined();
    expect(CreateMenuItemSchema.parse({ ...gin, imageKey: null }).imageKey).toBeNull();
    expect(CreateMenuItemSchema.parse({ ...gin, imageKey: tmp }).imageKey).toBe(tmp);
    const update = { ...gin, updatedAt: '2026-10-23T10:00:00.000Z' };
    expect(UpdateMenuItemSchema.parse(update).imageKey).toBeUndefined();
    expect(UpdateMenuItemSchema.parse({ ...update, imageKey: null }).imageKey).toBeNull();
  });

  it('rejects a non-string or oversized key', () => {
    expect(issues(CreateMenuItemSchema.safeParse({ ...gin, imageKey: 5 }))).toEqual(['imageKey']);
    expect(issues(CreateMenuItemSchema.safeParse({ ...gin, imageKey: 'x'.repeat(501) }))).toEqual(['imageKey']);
  });
});

describe('CreateImageUploadUrlSchema', () => {
  it('accepts the three image types', () => {
    for (const contentType of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(CreateImageUploadUrlSchema.safeParse({ contentType }).success).toBe(true);
    }
  });

  it('rejects any other type', () => {
    for (const contentType of ['image/gif', 'text/plain', 'application/pdf', '']) {
      expect(issues(CreateImageUploadUrlSchema.safeParse({ contentType }))).toEqual(['contentType']);
    }
  });
});

describe('menu reads (BRIEF-039)', () => {
  const item = {
    id: CATEGORY,
    categoryId: CATEGORY,
    name: 'จินโทนิค',
    description: null,
    imageUrl: null,
    itemType: 'simple',
    station: 'bar',
    isPromo: false,
    basePrice: '180.00',
    sortOrder: 0,
    availableNow: true,
    unavailableReason: null,
    windows: [],
    variants: [],
    updatedAt: '2026-10-23T10:00:00.000Z',
  };

  it('imageUrl is null or a URL', () => {
    expect(MenuItemSchema.safeParse(item).success).toBe(true);
    expect(MenuItemSchema.safeParse({ ...item, imageUrl: 'https://bucket.s3.amazonaws.com/menu/a.jpg?X-Amz-Signature=1' }).success).toBe(true);
    expect(MenuItemSchema.safeParse({ ...item, imageUrl: 'menu/a.jpg' }).success).toBe(false);
  });

  it('every category carries isActive', () => {
    expect(MenuCategorySchema.safeParse({ id: CATEGORY, name: 'ค็อกเทล', sortOrder: 0, isActive: false }).success).toBe(true);
    expect(MenuCategorySchema.safeParse({ id: CATEGORY, name: 'ค็อกเทล', sortOrder: 0 }).success).toBe(false);
  });

  it('includeHidden is true or false', () => {
    expect(MenuItemsQuerySchema.parse({ includeHidden: 'true' }).includeHidden).toBe('true');
    expect(MenuCategoriesQuerySchema.parse({}).includeHidden).toBeUndefined();
    expect(MenuCategoriesQuerySchema.safeParse({ includeHidden: 'yes' }).success).toBe(false);
  });
});
