import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { ClsService } from 'nestjs-cls';
import { In } from 'typeorm';
import type { MenuVariantInput } from '@bar/contracts';
import type {
  CategoryOrderRow,
  LockedMenuItem,
  MenuItemFields,
  MenuWriteRepository,
} from '../../domain/menu-write.repository.js';
import type { MenuCategoryRecord } from '../../domain/menu.types.js';
import { MenuCategory } from './menu-category.entity.js';
import { MenuItem } from './menu-item.entity.js';
import { MenuItemVariant } from './menu-item-variant.entity.js';
import { MenuVariantModifierGroup } from './menu-variant-modifier-group.entity.js';
import { ModifierGroup } from './modifier-group.entity.js';

const HOLD_CATEGORY = `SELECT id FROM menu_category WHERE id = $1 FOR KEY SHARE`;

const LOCK_ITEM = `SELECT updated_at AS "updatedAt", image_key AS "imageKey" FROM menu_item WHERE id = $1 FOR UPDATE`;

// A bare UPDATE: the trigger stamps updated_at (DR-023). updated_by keeps the editor of a variant-only edit.
const TOUCH_ITEM = `UPDATE menu_item SET updated_by = COALESCE($2, updated_by) WHERE id = $1`;

const ACTIVE_GROUPS = `
  SELECT DISTINCT l.modifier_group_id AS id
  FROM menu_variant_modifier_group l
  JOIN menu_item_variant v ON v.id = l.menu_item_variant_id
  WHERE v.menu_item_id = $1 AND v.is_available
`;

const NEXT_ITEM_SORT = `SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM menu_item WHERE category_id = $1`;

const NEXT_CATEGORY_SORT = `SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM menu_category`;

const LOCK_CATEGORIES = `
  SELECT id, is_active AS "isActive", sort_order AS "sortOrder"
  FROM menu_category
  ORDER BY sort_order, name
  FOR UPDATE
`;

const LOCK_CATEGORY_ITEMS = `
  SELECT (SELECT COUNT(*) FROM menu_item WHERE category_id = c.id) AS items
  FROM menu_category c
  WHERE c.id = $1
  FOR UPDATE
`;

@Injectable()
export class MenuWriteTypeormRepository implements MenuWriteRepository {
  public constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
    private readonly cls: ClsService,
  ) {}

  public async holdCategory(id: string): Promise<boolean> {
    return (await this.query(HOLD_CATEGORY, [id])).length > 0;
  }

  public async missingModifierGroups(ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const found = await this.txHost.tx.getRepository(ModifierGroup).find({
      select: { id: true },
      where: { id: In([...ids]) },
    });
    const known = new Set(found.map((group) => group.id));
    return ids.filter((id) => !known.has(id));
  }

  public async insertItem(
    id: string,
    fields: MenuItemFields,
    variants: readonly MenuVariantInput[],
    groupIds: readonly string[],
  ): Promise<void> {
    const [next] = await this.query(NEXT_ITEM_SORT, [fields.categoryId]);
    const item = this.txHost.tx.getRepository(MenuItem).create({
      id,
      ...this.itemColumns(fields),
      isAvailable: true,
      sortOrder: Number(next?.next ?? 0),
    });
    const saved = await this.txHost.tx.getRepository(MenuItem).save(item);
    const ids = await this.saveVariantSet(saved.id, variants, []);
    await this.replaceLinks(ids, groupIds);
  }

  public async lockItem(id: string): Promise<LockedMenuItem | null> {
    const [row] = await this.query(LOCK_ITEM, [id]);
    if (!row) return null;
    const variants = await this.txHost.tx.getRepository(MenuItemVariant).find({
      select: { id: true },
      where: { menuItemId: id },
    });
    const groups = await this.query(ACTIVE_GROUPS, [id]);
    return {
      updatedAt: new Date(row.updatedAt as string | Date),
      imageKey: typeof row.imageKey === 'string' ? row.imageKey : null,
      variantIds: variants.map((variant) => variant.id),
      groupIds: groups.map((group) => String(group.id)),
    };
  }

  public async updateItem(
    id: string,
    fields: MenuItemFields,
    variants: readonly MenuVariantInput[],
    groupIds: readonly string[],
  ): Promise<void> {
    const items = this.txHost.tx.getRepository(MenuItem);
    const item = await items.findOneOrFail({ where: { id } });
    Object.assign(item, this.itemColumns(fields));
    await items.save(item);
    // A variant-only or link-only edit changes no item column, so touch the row to move its stamp (MENU_ITEM_STALE).
    await this.query(TOUCH_ITEM, [id, this.cls.get('userId') ?? null]);
    const existing = await this.txHost.tx.getRepository(MenuItemVariant).find({ where: { menuItemId: id } });
    const active = await this.saveVariantSet(id, variants, existing);
    await this.replaceLinks(active, groupIds);
  }

  public async insertCategory(name: string): Promise<MenuCategoryRecord> {
    const [next] = await this.query(NEXT_CATEGORY_SORT, []);
    const categories = this.txHost.tx.getRepository(MenuCategory);
    const saved = await categories.save(
      categories.create({ name, isActive: true, sortOrder: Number(next?.next ?? 0) }),
    );
    return this.toCategory(saved);
  }

  public async saveCategory(
    id: string,
    patch: { name?: string; isActive?: boolean },
  ): Promise<MenuCategoryRecord | null> {
    const categories = this.txHost.tx.getRepository(MenuCategory);
    const category = await categories.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    if (!category) return null;
    if (patch.name !== undefined) category.name = patch.name;
    if (patch.isActive !== undefined) category.isActive = patch.isActive;
    return this.toCategory(await categories.save(category));
  }

  public async lockCategoryOrder(): Promise<CategoryOrderRow[]> {
    const rows = await this.query(LOCK_CATEGORIES, []);
    return rows.map((row) => ({
      id: String(row.id),
      isActive: row.isActive === true,
      sortOrder: Number(row.sortOrder),
    }));
  }

  public async saveCategoryOrder(ids: readonly string[]): Promise<void> {
    const categories = this.txHost.tx.getRepository(MenuCategory);
    const rows = await categories.find({ where: { id: In([...ids]) } });
    const position = new Map(ids.map((id, index) => [id, index]));
    const moved = rows.filter((row) => row.sortOrder !== position.get(row.id));
    for (const row of moved) row.sortOrder = position.get(row.id) ?? row.sortOrder;
    if (moved.length > 0) await categories.save(moved);
  }

  public async lockCategoryItemCount(id: string): Promise<number | null> {
    const [row] = await this.query(LOCK_CATEGORY_ITEMS, [id]);
    return row ? Number(row.items) : null;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.txHost.tx.getRepository(MenuCategory).delete({ id });
  }

  /** Returns the ids of the active variants, in input order. */
  private async saveVariantSet(
    itemId: string,
    variants: readonly MenuVariantInput[],
    existing: readonly MenuItemVariant[],
  ): Promise<string[]> {
    const repository = this.txHost.tx.getRepository(MenuItemVariant);
    const byId = new Map(existing.map((variant) => [variant.id, variant]));
    const listed = new Set(variants.flatMap((variant) => (variant.id ? [variant.id] : [])));
    const rows = variants.map((input) => {
      const row = (input.id ? byId.get(input.id) : undefined) ?? repository.create({ menuItemId: itemId });
      row.name = input.name;
      row.price = input.price;
      row.isAvailable = true;
      return row;
    });
    // Order lines reference variants, so a dropped one is turned off, never deleted (BRIEF-038 pre-decided).
    const dropped = existing.filter((variant) => !listed.has(variant.id) && variant.isAvailable);
    for (const row of dropped) row.isAvailable = false;
    const saved = await repository.save([...rows, ...dropped]);
    return saved.slice(0, rows.length).map((row) => row.id);
  }

  private async replaceLinks(variantIds: readonly string[], groupIds: readonly string[]): Promise<void> {
    if (variantIds.length === 0) return;
    const links = this.txHost.tx.getRepository(MenuVariantModifierGroup);
    await links.delete({ menuItemVariantId: In([...variantIds]) });
    const rows = variantIds.flatMap((menuItemVariantId) =>
      groupIds.map((modifierGroupId) => links.create({ menuItemVariantId, modifierGroupId })),
    );
    if (rows.length > 0) await links.insert(rows);
  }

  private itemColumns(fields: MenuItemFields): Partial<MenuItem> {
    return {
      categoryId: fields.categoryId,
      name: fields.name,
      description: fields.description,
      imageKey: fields.imageKey,
      itemType: fields.itemType,
      kitchenTag: fields.kitchenTag,
      isPromo: fields.isPromo,
      basePrice: fields.basePrice,
    };
  }

  private toCategory(row: MenuCategory): MenuCategoryRecord {
    return { id: row.id, name: row.name, sortOrder: row.sortOrder, isActive: row.isActive };
  }

  private async query(sql: string, parameters: unknown[]): Promise<Record<string, unknown>[]> {
    const result: unknown = await this.txHost.tx.query(sql, parameters);
    return Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
  }
}
