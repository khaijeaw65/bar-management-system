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
}

export const MENU_CATALOG_REPOSITORY = Symbol('MENU_CATALOG_REPOSITORY');
