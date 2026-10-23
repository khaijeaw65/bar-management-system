import {
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
