import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { MenuCatalogRepository } from '../../domain/menu-catalog.repository.js';
import type {
  MenuCategoryRecord,
  MenuGroupRecord,
  MenuItemRecord,
} from '../../domain/menu.types.js';
import { MenuCategory } from './menu-category.entity.js';
import { MenuItem } from './menu-item.entity.js';
import { MenuItemAvailability } from './menu-item-availability.entity.js';
import { MenuItemVariant } from './menu-item-variant.entity.js';
import { MenuVariantModifierGroup } from './menu-variant-modifier-group.entity.js';
import { groupBy, groupsByVariant, toMenuItemRecord } from './menu-catalog.mapper.js';
import type { ModifierRow } from './menu-catalog.typeorm-repository.types.js';

const SHARE_ITEMS = `
  SELECT mi.id, mi.is_available AS available
  FROM menu_item mi
  JOIN menu_item_variant v ON v.menu_item_id = mi.id
  WHERE v.id = ANY($1::uuid[])
  ORDER BY mi.id
  FOR SHARE OF mi
`;

const LOCK_ITEM = `
  SELECT is_available AS available
  FROM menu_item
  WHERE id = $1
  FOR UPDATE
`;

const MODIFIERS = `
  SELECT l.menu_item_variant_id AS "variantId",
         g.id AS "groupId",
         g.name AS "groupName",
         g.is_required AS "isRequired",
         g.min_select AS "minSelect",
         g.max_select AS "maxSelect",
         o.id AS "optionId",
         o.name AS "optionName",
         o.price_delta AS "priceDelta",
         o.is_available AS "isAvailable"
  FROM menu_variant_modifier_group l
  JOIN modifier_group g ON g.id = l.modifier_group_id
  LEFT JOIN modifier_option o ON o.group_id = g.id
  WHERE l.menu_item_variant_id = ANY($1::uuid[])
  ORDER BY g.is_required DESC, g.name, o.name
`;

@Injectable()
export class MenuCatalogTypeormRepository implements MenuCatalogRepository {
  public constructor(
    @InjectRepository(MenuCategory)
    private readonly categories: Repository<MenuCategory>,
    @InjectRepository(MenuItem)
    private readonly items: Repository<MenuItem>,
    @InjectRepository(MenuItemAvailability)
    private readonly windows: Repository<MenuItemAvailability>,
    @InjectRepository(MenuItemVariant)
    private readonly variants: Repository<MenuItemVariant>,
    @InjectRepository(MenuVariantModifierGroup)
    private readonly links: Repository<MenuVariantModifierGroup>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  public async listCategories(includeHidden = false): Promise<MenuCategoryRecord[]> {
    const rows = await this.categories.find({
      where: includeHidden ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    const counts = await this.items
      .createQueryBuilder('item')
      .select('item.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'items')
      .groupBy('item.categoryId')
      .getRawMany<{ categoryId: string; items: string }>();
    const itemCount = new Map(counts.map((row) => [row.categoryId, Number(row.items)]));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      itemCount: itemCount.get(row.id) ?? 0,
    }));
  }

  public async listItems(categoryId?: string, includeHidden = false): Promise<MenuItemRecord[]> {
    const visibility = includeHidden ? {} : { isActive: true };
    const categories = await this.categories.find({
      where: categoryId ? { id: categoryId, ...visibility } : visibility,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    if (categories.length === 0) return [];
    const categoryIds = categories.map((category) => category.id);
    const items = await this.items.find({
      where: { categoryId: In(categoryIds) },
    });
    const order = new Map(categories.map((category, index) => [category.id, index]));
    items.sort((left, right) => {
      const byCategory =
        (order.get(left.categoryId) ?? 0) - (order.get(right.categoryId) ?? 0);
      if (byCategory !== 0) return byCategory;
      return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'th');
    });
    const active = new Map(categories.map((category) => [category.id, category.isActive]));
    return this.assemble(items, active);
  }

  public async findItem(id: string): Promise<MenuItemRecord | null> {
    const item = await this.items.findOne({ where: { id } });
    if (!item) return null;
    const category = await this.categories.findOne({
      where: { id: item.categoryId },
    });
    const active = new Map([[item.categoryId, category?.isActive ?? false]]);
    const [record] = await this.assemble([item], active);
    return record ?? null;
  }

  public async shareItems(variantIds: readonly string[]): Promise<ReadonlyMap<string, boolean>> {
    if (variantIds.length === 0) return new Map();
    const result: unknown = await this.txHost.tx.query(SHARE_ITEMS, [[...variantIds]]);
    const flags = new Map<string, boolean>();
    for (const row of this.rows(result)) {
      const id = row.id;
      if (typeof id !== 'string') continue;
      flags.set(id, this.asBoolean(row.available));
    }
    return flags;
  }

  public async lockItem(id: string): Promise<MenuItemRecord | null> {
    const result: unknown = await this.txHost.tx.query(LOCK_ITEM, [id]);
    const row = this.rows(result)[0];
    if (!row) return null;
    const record = await this.findItem(id);
    if (!record) return null;
    record.isAvailable = this.asBoolean(row.available);
    return record;
  }

  public async saveAvailability(id: string, available: boolean): Promise<Date> {
    const items = this.txHost.tx.getRepository(MenuItem);
    const item = await items.findOneByOrFail({ id });
    item.isAvailable = available;
    await items.save(item);
    // Re-read in this transaction: the trigger sets updated_at (DR-023), so the saved entity's copy is not the stored value.
    return (await items.findOneByOrFail({ id })).updatedAt;
  }

  public async findVariants(ids: readonly string[]): Promise<MenuItemRecord[]> {
    if (ids.length === 0) return [];
    const variants = await this.variants.find({ where: { id: In([...ids]) } });
    if (variants.length === 0) return [];
    const itemIds = [...new Set(variants.map((variant) => variant.menuItemId))];
    const items = await this.items.find({ where: { id: In(itemIds) } });
    const categoryIds = [...new Set(items.map((item) => item.categoryId))];
    const categories = await this.categories.find({
      where: { id: In(categoryIds) },
    });
    const active = new Map(
      categories.map((category) => [category.id, category.isActive]),
    );
    const wanted = new Set(ids);
    const records = await this.assemble(items, active, variants);
    return records.map((record) => ({
      ...record,
      variants: record.variants.filter((variant) => wanted.has(variant.id)),
    }));
  }

  private async assemble(
    items: MenuItem[],
    categoryActive: Map<string, boolean>,
    knownVariants?: MenuItemVariant[],
  ): Promise<MenuItemRecord[]> {
    if (items.length === 0) return [];
    const itemIds = items.map((item) => item.id);
    const [windows, variants] = await Promise.all([
      this.windows.find({ where: { menuItemId: In(itemIds) } }),
      knownVariants
        ? Promise.resolve(knownVariants)
        : this.variants.find({ where: { menuItemId: In(itemIds) } }),
    ]);
    const groups = await this.modifierGroups(variants.map((variant) => variant.id));
    const windowsByItem = groupBy(windows, (window) => window.menuItemId);
    const variantsByItem = groupBy(variants, (variant) => variant.menuItemId);
    return items.map((item) =>
      toMenuItemRecord(
        item,
        categoryActive.get(item.categoryId) ?? false,
        windowsByItem.get(item.id) ?? [],
        variantsByItem.get(item.id) ?? [],
        groups,
      ),
    );
  }

  private async modifierGroups(
    variantIds: string[],
  ): Promise<Map<string, MenuGroupRecord[]>> {
    if (variantIds.length === 0) return new Map();
    const rows: ModifierRow[] = await this.links.query(MODIFIERS, [variantIds]);
    return groupsByVariant(rows);
  }

  private asBoolean(value: unknown): boolean {
    return value === true || value === 't' || value === 'true';
  }

  private rows(result: unknown): Record<string, unknown>[] {
    if (!Array.isArray(result)) return [];
    const nested: unknown = result[0];
    if (Array.isArray(nested) && result.length === 2 && typeof result[1] === 'number') {
      return nested as Record<string, unknown>[];
    }
    return result as Record<string, unknown>[];
  }
}
