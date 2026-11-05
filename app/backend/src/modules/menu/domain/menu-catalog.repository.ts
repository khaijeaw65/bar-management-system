import type {
  MenuCategoryRecord,
  MenuItemRecord,
} from './menu.types.js';

export abstract class MenuCatalogRepository {
  /** Active categories; hidden ones too when `includeHidden`. */
  public abstract listCategories(includeHidden?: boolean): Promise<MenuCategoryRecord[]>;
  /** Ordered by category then item sort_order. Items of hidden categories only when `includeHidden`. */
  public abstract listItems(categoryId?: string, includeHidden?: boolean): Promise<MenuItemRecord[]>;
  public abstract findItem(id: string): Promise<MenuItemRecord | null>;
  /** Items that own the requested variants. Variants are filtered to those ids. */
  public abstract findVariants(ids: readonly string[]): Promise<MenuItemRecord[]>;
  /**
   * Locks the items that own these variants `FOR SHARE` and returns each item's
   * committed `is_available`. The read happens on the lock, so a waiting 86 is visible.
   */
  public abstract shareItems(variantIds: readonly string[]): Promise<ReadonlyMap<string, boolean>>;
  /** Locks one item `FOR UPDATE`. Null when the id does not exist. */
  public abstract lockItem(id: string): Promise<MenuItemRecord | null>;
  /** Returns the `updated_at` the database stamped on the item (DR-023). */
  public abstract saveAvailability(id: string, available: boolean): Promise<Date>;
}
