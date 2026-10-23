import type {
  MenuCategoryRecord,
  MenuItemRecord,
} from './menu.types.js';

export interface MenuCatalogRepository {
  /** Active categories; hidden ones too when `includeHidden`. */
  listCategories(includeHidden?: boolean): Promise<MenuCategoryRecord[]>;
  /** Ordered by category then item sort_order. Items of hidden categories only when `includeHidden`. */
  listItems(categoryId?: string, includeHidden?: boolean): Promise<MenuItemRecord[]>;
  findItem(id: string): Promise<MenuItemRecord | null>;
  /** Items that own the requested variants. Variants are filtered to those ids. */
  findVariants(ids: readonly string[]): Promise<MenuItemRecord[]>;
  /**
   * Locks the items that own these variants `FOR SHARE` and returns each item's
   * committed `is_available`. The read happens on the lock, so a waiting 86 is visible.
   */
  shareItems(variantIds: readonly string[]): Promise<ReadonlyMap<string, boolean>>;
  /** Locks one item `FOR UPDATE`. Null when the id does not exist. */
  lockItem(id: string): Promise<MenuItemRecord | null>;
  saveAvailability(id: string, available: boolean): Promise<void>;
}

export const MENU_CATALOG_REPOSITORY = Symbol('MENU_CATALOG_REPOSITORY');
