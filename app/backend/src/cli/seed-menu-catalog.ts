import type { DataSource, Repository } from 'typeorm';
import type { ItemType, KitchenStation } from '@bar/contracts';
import { MenuCategory } from '../modules/menu/infrastructure/persistence/menu-category.entity.js';
import { MenuItem } from '../modules/menu/infrastructure/persistence/menu-item.entity.js';
import { MenuItemAvailability } from '../modules/menu/infrastructure/persistence/menu-item-availability.entity.js';
import { MenuItemVariant } from '../modules/menu/infrastructure/persistence/menu-item-variant.entity.js';
import { MenuVariantModifierGroup } from '../modules/menu/infrastructure/persistence/menu-variant-modifier-group.entity.js';
import { ModifierGroup } from '../modules/menu/infrastructure/persistence/modifier-group.entity.js';
import { ModifierOption } from '../modules/menu/infrastructure/persistence/modifier-option.entity.js';

interface SeedOption {
  name: string;
  priceDelta: string;
}

interface SeedGroup {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: SeedOption[];
}

interface SeedWindow {
  days: number[];
  start: string;
  end: string;
}

interface SeedItem {
  name: string;
  variants: Array<{ name: string; price: string }>;
  itemType: ItemType;
  kitchenTag: KitchenStation | null;
  available: boolean;
  promo: boolean;
  window?: SeedWindow;
  groups?: string[];
}

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];
const FRIDAY_SATURDAY = [5, 6];

const GROUPS: SeedGroup[] = [
  {
    name: 'น้ำแข็ง',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: 'ปกติ', priceDelta: '0.00' },
      { name: 'ก้อนใหญ่', priceDelta: '0.00' },
    ],
  },
  {
    name: 'เพิ่ม',
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    options: [{ name: 'เชอร์รี่', priceDelta: '20.00' }],
  },
];

const MENU: Array<{ name: string; items: SeedItem[] }> = [
  {
    name: 'โปรโมชั่น',
    items: [
      promo('ลีโอ 4 ขวด + ถังน้ำแข็ง', '390.00', {
        days: EVERY_DAY,
        start: '17:00:00',
        end: '21:00:00',
      }),
      promo('ค็อกเทล 1 แถม 1', '240.00', {
        days: FRIDAY_SATURDAY,
        start: '22:00:00',
        end: '02:00:00',
      }),
    ],
  },
  {
    name: 'เบียร์สด',
    items: [
      drink('ช้างดราฟต์', '120.00'),
      drink('สิงห์ดราฟต์', '140.00'),
      drink('ลีโอขวด', '100.00'),
    ],
  },
  {
    name: 'ค็อกเทล',
    items: [
      drink('เนโกรนี', '240.00'),
      {
        name: 'โอลด์แฟชั่น',
        variants: [
          { name: 'ปกติ', price: '260.00' },
          { name: 'ดับเบิล', price: '360.00' },
        ],
        itemType: 'simple',
        kitchenTag: 'bar',
        available: true,
        promo: false,
        groups: ['น้ำแข็ง', 'เพิ่ม'],
      },
    ],
  },
  {
    name: 'ไฮบอล',
    items: [drink('ไฮบอลมะนาวโซดา', '180.00')],
  },
  {
    name: 'อาหาร',
    items: [
      food('ยำหมูยอ', '150.00', false),
      food('ถั่วทอดสมุนไพร', '80.00', true),
    ],
  },
  {
    name: 'ค่าบริการ',
    items: [
      {
        name: 'ค่าเปิดขวด',
        variants: [{ name: 'ปกติ', price: '300.00' }],
        itemType: 'charge',
        kitchenTag: null,
        available: true,
        promo: false,
      },
    ],
  },
];

export async function seedMenu(dataSource: DataSource): Promise<void> {
  const groups = new Map<string, ModifierGroup>();
  for (const group of GROUPS) {
    groups.set(group.name, await upsertGroup(dataSource, group));
  }
  for (const [index, category] of MENU.entries()) {
    const saved = await upsertCategory(dataSource, category.name, index + 1);
    for (const [itemIndex, item] of category.items.entries()) {
      await upsertItem(dataSource, saved, item, itemIndex + 1, groups);
    }
  }
}

function drink(name: string, price: string): SeedItem {
  return {
    name,
    variants: [{ name: 'ปกติ', price }],
    itemType: 'simple',
    kitchenTag: 'bar',
    available: true,
    promo: false,
  };
}

function food(name: string, price: string, available: boolean): SeedItem {
  return {
    name,
    variants: [{ name: 'ปกติ', price }],
    itemType: 'simple',
    kitchenTag: 'food',
    available,
    promo: false,
  };
}

function promo(name: string, price: string, window: SeedWindow): SeedItem {
  return {
    name,
    variants: [{ name: 'ปกติ', price }],
    itemType: 'simple',
    kitchenTag: 'bar',
    available: true,
    promo: true,
    window,
  };
}

async function upsertCategory(
  dataSource: DataSource,
  name: string,
  sortOrder: number,
): Promise<MenuCategory> {
  const categories = dataSource.getRepository(MenuCategory);
  const row = (await categories.findOne({ where: { name } })) ?? categories.create({ name });
  row.sortOrder = sortOrder;
  row.isActive = true;
  return categories.save(row);
}

async function upsertGroup(
  dataSource: DataSource,
  group: SeedGroup,
): Promise<ModifierGroup> {
  const groups = dataSource.getRepository(ModifierGroup);
  const row = (await groups.findOne({ where: { name: group.name } })) ?? groups.create({ name: group.name });
  row.isRequired = group.isRequired;
  row.minSelect = group.minSelect;
  row.maxSelect = group.maxSelect;
  const saved = await groups.save(row);
  const options = dataSource.getRepository(ModifierOption);
  for (const option of group.options) {
    await upsertOption(options, saved.id, option);
  }
  return saved;
}

async function upsertOption(
  options: Repository<ModifierOption>,
  groupId: string,
  option: SeedOption,
): Promise<void> {
  const row =
    (await options.findOne({ where: { groupId, name: option.name } })) ??
    options.create({ groupId, name: option.name });
  row.priceDelta = option.priceDelta;
  row.isAvailable = true;
  await options.save(row);
}

async function upsertItem(
  dataSource: DataSource,
  category: MenuCategory,
  item: SeedItem,
  sortOrder: number,
  groups: Map<string, ModifierGroup>,
): Promise<void> {
  const items = dataSource.getRepository(MenuItem);
  const row =
    (await items.findOne({ where: { name: item.name, categoryId: category.id } })) ??
    items.create({ name: item.name, categoryId: category.id });
  row.description = null;
  row.imageKey = null;
  row.basePrice = lowest(item.variants.map((variant) => variant.price));
  row.itemType = item.itemType;
  row.kitchenTag = item.kitchenTag;
  row.isAvailable = item.available;
  row.isPromo = item.promo;
  row.sortOrder = sortOrder;
  const saved = await items.save(row);
  const variantIds: string[] = [];
  for (const variant of item.variants) {
    variantIds.push(await upsertVariant(dataSource, saved.id, variant));
  }
  if (item.window) await upsertWindow(dataSource, saved.id, item.window);
  for (const variantId of variantIds) {
    await linkVariantGroups({
      dataSource,
      variantId,
      groupNames: item.groups ?? [],
      groups,
    });
  }
}

interface LinkVariantGroupsInput {
  dataSource: DataSource;
  variantId: string;
  groupNames: readonly string[];
  groups: Map<string, ModifierGroup>;
}

async function linkVariantGroups(input: LinkVariantGroupsInput): Promise<void> {
  for (const groupName of input.groupNames) {
    const group = input.groups.get(groupName);
    if (!group) throw new Error(`missing modifier group ${groupName}`);
    await linkGroup(input.dataSource, input.variantId, group.id);
  }
}

async function upsertVariant(
  dataSource: DataSource,
  menuItemId: string,
  variant: { name: string; price: string },
): Promise<string> {
  const variants = dataSource.getRepository(MenuItemVariant);
  const row =
    (await variants.findOne({ where: { menuItemId, name: variant.name } })) ??
    variants.create({ menuItemId, name: variant.name });
  row.price = variant.price;
  row.isAvailable = true;
  const saved = await variants.save(row);
  return saved.id;
}

async function upsertWindow(
  dataSource: DataSource,
  menuItemId: string,
  window: SeedWindow,
): Promise<void> {
  const windows = dataSource.getRepository(MenuItemAvailability);
  const row =
    (await windows.findOne({ where: { menuItemId } })) ??
    windows.create({ menuItemId });
  row.daysOfWeek = window.days;
  row.startTime = window.start;
  row.endTime = window.end;
  await windows.save(row);
}

async function linkGroup(
  dataSource: DataSource,
  menuItemVariantId: string,
  modifierGroupId: string,
): Promise<void> {
  const links = dataSource.getRepository(MenuVariantModifierGroup);
  const existing = await links.findOne({
    where: { menuItemVariantId, modifierGroupId },
  });
  if (existing) return;
  await links.save(links.create({ menuItemVariantId, modifierGroupId }));
}

function lowest(prices: string[]): string {
  const first = prices[0];
  if (!first) throw new Error('item has no variant prices');
  return prices.reduce(
    (min, price) => (Number(price) < Number(min) ? price : min),
    first,
  );
}
