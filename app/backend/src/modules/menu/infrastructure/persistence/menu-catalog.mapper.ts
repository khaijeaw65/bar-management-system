import type {
  MenuGroupRecord,
  MenuItemRecord,
  MenuVariantRecord,
  MenuWindowRecord,
} from '../../domain/menu.types.js';
import type { MenuItem } from './menu-item.entity.js';
import type { MenuItemAvailability } from './menu-item-availability.entity.js';
import type { MenuItemVariant } from './menu-item-variant.entity.js';
import type { ModifierRow } from './menu-catalog.typeorm-repository.types.js';

export function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const id = key(row);
    const list = grouped.get(id);
    if (list) list.push(row);
    else grouped.set(id, [row]);
  }
  return grouped;
}

export function toMenuItemRecord(
  item: MenuItem,
  categoryActive: boolean,
  windows: MenuItemAvailability[],
  variants: MenuItemVariant[],
  groups: Map<string, MenuGroupRecord[]>,
): MenuItemRecord {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryActive,
    name: item.name,
    description: item.description,
    imageKey: item.imageKey,
    basePrice: String(item.basePrice),
    itemType: item.itemType,
    kitchenTag: item.kitchenTag,
    isAvailable: item.isAvailable,
    isPromo: item.isPromo,
    sortOrder: item.sortOrder,
    updatedAt: item.updatedAt,
    windows: windows.map(toWindow),
    variants: variants
      .map((variant) => toVariant(variant, groups.get(variant.id) ?? []))
      .sort(byPriceThenName),
  };
}

export function groupsByVariant(rows: ModifierRow[]): Map<string, MenuGroupRecord[]> {
  const byVariant = collectVariantGroups(rows);
  const result = new Map<string, MenuGroupRecord[]>();
  for (const [variantId, groups] of byVariant) {
    result.set(variantId, sortGroups([...groups.values()]));
  }
  return result;
}

function collectVariantGroups(rows: ModifierRow[]): Map<string, Map<string, MenuGroupRecord>> {
  const byVariant = new Map<string, Map<string, MenuGroupRecord>>();
  for (const row of rows) {
    const group = ensureGroup(byVariant, row);
    if (row.optionId && row.optionName && row.priceDelta !== null) {
      group.options.push({
        id: row.optionId,
        name: row.optionName,
        priceDelta: String(row.priceDelta),
        isAvailable: row.isAvailable ?? true,
      });
    }
  }
  return byVariant;
}

function ensureGroup(
  byVariant: Map<string, Map<string, MenuGroupRecord>>,
  row: ModifierRow,
): MenuGroupRecord {
  let groups = byVariant.get(row.variantId);
  if (!groups) {
    groups = new Map();
    byVariant.set(row.variantId, groups);
  }
  let group = groups.get(row.groupId);
  if (!group) {
    group = {
      id: row.groupId,
      name: row.groupName,
      isRequired: row.isRequired,
      minSelect: Number(row.minSelect),
      maxSelect: Number(row.maxSelect),
      options: [],
    };
    groups.set(row.groupId, group);
  }
  return group;
}

function sortGroups(list: MenuGroupRecord[]): MenuGroupRecord[] {
  for (const group of list) {
    group.options.sort((left, right) => left.name.localeCompare(right.name, 'th'));
  }
  return list.sort(
    (left, right) =>
      Number(right.isRequired) - Number(left.isRequired) ||
      left.name.localeCompare(right.name, 'th'),
  );
}

function toWindow(window: MenuItemAvailability): MenuWindowRecord {
  return {
    daysOfWeek: window.daysOfWeek.map(Number),
    startTime: String(window.startTime),
    endTime: String(window.endTime),
  };
}

function toVariant(
  variant: MenuItemVariant,
  modifierGroups: MenuGroupRecord[],
): MenuVariantRecord {
  return {
    id: variant.id,
    name: variant.name,
    price: String(variant.price),
    isAvailable: variant.isAvailable,
    modifierGroups,
  };
}

function byPriceThenName(left: MenuVariantRecord, right: MenuVariantRecord): number {
  return Number(left.price) - Number(right.price) || left.name.localeCompare(right.name, 'th');
}
