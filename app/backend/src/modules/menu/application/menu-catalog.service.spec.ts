import type { MenuCatalogRepository } from '../domain/menu-catalog.repository.js';
import type { MenuItemRecord } from '../domain/menu.types.js';
import { MenuCatalogService } from './menu-catalog.service.js';

const ITEM = '11111111-1111-4111-8111-111111111111';
const VARIANT = '22222222-2222-4222-8222-222222222222';
const MISSING = '33333333-3333-4333-8333-333333333333';
const NOON = new Date('2026-10-16T12:00:00.000Z');

function record(overrides: Partial<MenuItemRecord> = {}): MenuItemRecord {
  return {
    id: ITEM,
    categoryId: ITEM,
    categoryActive: true,
    name: 'โอลด์แฟชั่น',
    description: null,
    basePrice: '260.00',
    itemType: 'simple',
    kitchenTag: 'bar',
    isAvailable: true,
    isPromo: false,
    sortOrder: 1,
    windows: [],
    variants: [
      {
        id: VARIANT,
        name: 'ปกติ',
        price: '260.00',
        isAvailable: true,
        modifierGroups: [
          {
            id: ITEM,
            name: 'น้ำแข็ง',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            options: [
              {
                id: VARIANT,
                name: 'ปกติ',
                priceDelta: '0.00',
                isAvailable: true,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('MenuCatalogService.getOrderable', () => {
  const findVariants = vi.fn<MenuCatalogRepository['findVariants']>();
  const catalog: MenuCatalogRepository = {
    listCategories: async () => [],
    listItems: async () => [],
    findItem: async () => null,
    findVariants,
  };
  const service = new MenuCatalogService(catalog, { now: () => NOON });

  it('returns price, station, and modifiers, and reports an unknown id', async () => {
    findVariants.mockResolvedValue([record()]);
    const lookup = await service.getOrderable([VARIANT, MISSING], NOON);
    expect(lookup.missing).toEqual([MISSING]);
    expect(lookup.found).toEqual([
      expect.objectContaining({
        variantId: VARIANT,
        price: '260.00',
        itemName: 'โอลด์แฟชั่น',
        variantName: 'ปกติ',
        itemType: 'simple',
        kitchenTag: 'bar',
        availableNow: true,
        unavailableReason: null,
        modifierGroups: [
          expect.objectContaining({ name: 'น้ำแข็ง', isRequired: true }),
        ],
      }),
    ]);
  });

  it('uses the same availability rule as the menu list', async () => {
    findVariants.mockResolvedValue([
      record({
        isAvailable: false,
        windows: [
          { daysOfWeek: [1, 2, 3, 4, 5, 6, 7], startTime: '17:00', endTime: '21:00' },
        ],
      }),
    ]);
    const lookup = await service.getOrderable([VARIANT], NOON);
    expect(lookup.found[0]).toMatchObject({
      availableNow: false,
      unavailableReason: 'sold_out',
    });
  });

  it('does not throw when every id is missing', async () => {
    findVariants.mockResolvedValue([]);
    await expect(service.getOrderable([MISSING], NOON)).resolves.toEqual({
      found: [],
      missing: [MISSING],
    });
  });
});
