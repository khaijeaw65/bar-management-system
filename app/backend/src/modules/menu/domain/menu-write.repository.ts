import type { ItemType, KitchenStation, MenuVariantInput } from '@bar/contracts';
import type { MenuCategoryRecord } from './menu.types.js';

export interface MenuItemFields {
  categoryId: string;
  name: string;
  description: string | null;
  /** `menu/<itemId>/…` key, or null for no photo. */
  imageKey: string | null;
  itemType: ItemType;
  kitchenTag: KitchenStation | null;
  isPromo: boolean;
  /** Lowest active variant price (the "from" price on menu tiles). */
  basePrice: string;
}

/** The row a PATCH checks under `FOR UPDATE`. */
export interface LockedMenuItem {
  updatedAt: Date;
  imageKey: string | null;
  variantIds: string[];
  /** Union of the groups linked to the item's active variants. */
  groupIds: string[];
}

export interface CategoryOrderRow {
  id: string;
  isActive: boolean;
  sortOrder: number;
}

/** Every method runs on the caller's transaction. */
export interface MenuWriteRepository {
  /** Locks the category `FOR KEY SHARE`, so a concurrent delete waits for this write. */
  holdCategory(id: string): Promise<boolean>;
  /** Ids that are unknown or archived; the active ones are held `FOR KEY SHARE` (DR-024). */
  missingModifierGroups(ids: readonly string[]): Promise<string[]>;
  /** The caller picks `id`, so the photo can be copied to `menu/<id>/…` before the row exists. */
  insertItem(
    id: string,
    fields: MenuItemFields,
    variants: readonly MenuVariantInput[],
    groupIds: readonly string[],
  ): Promise<void>;
  lockItem(id: string): Promise<LockedMenuItem | null>;
  /**
   * Saves the item and its variant set: listed ids are updated and re-activated, new ones inserted,
   * the rest deactivated. Links of every active variant become `groupIds`. The item row is always
   * touched, so a variant-only or link-only edit still moves its `updated_at` (DR-023).
   */
  updateItem(
    id: string,
    fields: MenuItemFields,
    variants: readonly MenuVariantInput[],
    groupIds: readonly string[],
  ): Promise<void>;
  insertCategory(name: string): Promise<MenuCategoryRecord>;
  saveCategory(id: string, patch: { name?: string; isActive?: boolean }): Promise<MenuCategoryRecord | null>;
  /** All categories, active and hidden, locked `FOR UPDATE`, in the current order. */
  lockCategoryOrder(): Promise<CategoryOrderRow[]>;
  saveCategoryOrder(ids: readonly string[]): Promise<void>;
  /** Locks the category `FOR UPDATE`; null when it does not exist. */
  lockCategoryItemCount(id: string): Promise<number | null>;
  deleteCategory(id: string): Promise<void>;
}

export const MENU_WRITE_REPOSITORY = Symbol('MENU_WRITE_REPOSITORY');
