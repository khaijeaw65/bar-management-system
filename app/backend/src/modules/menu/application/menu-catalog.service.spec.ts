import { asStorage, FakeStorage } from '../../../../test/fake-storage.js';
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
    imageKey: null,
    basePrice: '260.00',
    itemType: 'simple',
    kitchenTag: 'bar',
    isAvailable: true,
    isPromo: false,
    sortOrder: 1,
    updatedAt: NOON,
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
  const shareItems = vi.fn<MenuCatalogRepository['shareItems']>(async () => new Map());
  const catalog: MenuCatalogRepository = {
    listCategories: async () => [],
    listItems: async () => [],
    findItem: async () => null,
    findVariants,
    shareItems,
    lockItem: async () => null,
    saveAvailability: async () => NOON,
  };
  const service = new MenuCatalogService(catalog, { now: () => NOON }, asStorage(new FakeStorage()));

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

  it('reports a turned-off variant as sold out', async () => {
    const item = record();
    const variant = item.variants[0];
    if (!variant) throw new Error('fixture variant missing');
    variant.isAvailable = false;
    findVariants.mockResolvedValue([item]);
    const lookup = await service.getOrderable([VARIANT], NOON);
    expect(lookup.found[0]).toMatchObject({
      availableNow: false,
      unavailableReason: 'sold_out',
    });
  });

  it('reports an inactive category as sold out', async () => {
    findVariants.mockResolvedValue([record({ categoryActive: false })]);
    const lookup = await service.getOrderable([VARIANT], NOON);
    expect(lookup.found[0]).toMatchObject({
      availableNow: false,
      unavailableReason: 'sold_out',
    });
  });

  it('uses the locked availability flag, read before the variant lookup', async () => {
    shareItems.mockResolvedValue(new Map([[ITEM, false]]));
    findVariants.mockResolvedValue([record({ isAvailable: true })]);
    const lookup = await service.getOrderable([VARIANT], NOON, { lock: 'share' });
    expect(lookup.found[0]).toMatchObject({ availableNow: false, unavailableReason: 'sold_out' });
    const lockedAt = shareItems.mock.invocationCallOrder[0] ?? 0;
    const readAt = findVariants.mock.invocationCallOrder.at(-1) ?? 0;
    expect(lockedAt).toBeLessThan(readAt);
  });

  it('does not throw when every id is missing', async () => {
    findVariants.mockResolvedValue([]);
    await expect(service.getOrderable([MISSING], NOON)).resolves.toEqual({
      found: [],
      missing: [MISSING],
    });
  });
});

describe('MenuCatalogService reads (BRIEF-039)', () => {
  const listItems = vi.fn<MenuCatalogRepository['listItems']>();
  const listCategories = vi.fn<MenuCatalogRepository['listCategories']>();
  const findItem = vi.fn<MenuCatalogRepository['findItem']>();
  const catalog = {
    listCategories,
    listItems,
    findItem,
  } as unknown as MenuCatalogRepository;
  const service = new MenuCatalogService(catalog, { now: () => NOON }, asStorage(new FakeStorage()));

  it('imageUrl is a presigned GET for the stored key and null without one', async () => {
    findItem.mockResolvedValueOnce(record({ imageKey: `menu/${ITEM}/photo.jpg` }));
    expect((await service.getItem(ITEM)).imageUrl).toBe(`https://fake-s3.test/bar-test/menu/${ITEM}/photo.jpg?X-Amz-Signature=fake`);
    findItem.mockResolvedValueOnce(record());
    expect((await service.getItem(ITEM)).imageUrl).toBeNull();
  });

  it('shows no photo, and still answers, when signing fails', async () => {
    const storage = new FakeStorage();
    storage.failRead = true;
    const failing = new MenuCatalogService(
      { ...catalog, lockItem: async () => record({ imageKey: `menu/${ITEM}/photo.jpg` }), saveAvailability: async () => NOON } as unknown as MenuCatalogRepository,
      { now: () => NOON },
      asStorage(storage),
    );
    findItem.mockResolvedValueOnce(record({ imageKey: `menu/${ITEM}/photo.jpg` }));
    listItems.mockResolvedValueOnce([record({ imageKey: `menu/${ITEM}/photo.jpg` }), record({ id: MISSING })]);
    expect((await failing.getItem(ITEM)).imageUrl).toBeNull();
    const listed = await failing.listItems({ availableOnly: false });
    expect(listed.items.map((entry) => entry.imageUrl)).toEqual([null, null]);
    // The 86 toggle (SoldOutService runs it inside a transaction) must still produce its item.
    const toggled = await failing.setAvailability(ITEM, false);
    expect(toggled).toMatchObject({ changed: true, item: { imageUrl: null, availableNow: false } });
  });

  it('lists items of a hidden category only for includeHidden, as not available', async () => {
    listItems.mockResolvedValue([record({ categoryActive: false })]);
    expect((await service.listItems({ availableOnly: false })).items).toEqual([]);
    const hidden = await service.listItems({ availableOnly: false, includeHidden: true });
    expect(hidden.items).toHaveLength(1);
    expect(hidden.items[0]).toMatchObject({ availableNow: false, unavailableReason: 'sold_out' });
    expect(listItems).toHaveBeenLastCalledWith(undefined, true);
    expect((await service.listItems({ availableOnly: true, includeHidden: true })).items).toEqual([]);
  });

  it('passes includeHidden to the category read', async () => {
    listCategories.mockResolvedValue([{ id: ITEM, name: 'ซ่อน', sortOrder: 0, isActive: false, itemCount: 3 }]);
    expect(await service.listCategories(true)).toEqual({
      items: [{ id: ITEM, name: 'ซ่อน', sortOrder: 0, isActive: false, itemCount: 3 }],
    });
    expect(listCategories).toHaveBeenLastCalledWith(true);
  });
});
