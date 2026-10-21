import type {
  MenuCategoryRecord,
  MenuItemRecord,
} from './menu.types.js';

export interface MenuCatalogRepository {
  listCategories(): Promise<MenuCategoryRecord[]>;
  /** Active categories only, ordered by category then item sort_order. */
  listItems(categoryId?: string): Promise<MenuItemRecord[]>;
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
