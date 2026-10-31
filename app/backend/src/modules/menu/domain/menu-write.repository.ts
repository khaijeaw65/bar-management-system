import type { MenuVariantInput } from '@bar/contracts';
import type { MenuCategoryRecord } from './menu.types.js';
import type { CategoryOrderRow, LockedMenuItem, MenuItemFields } from './menu-write.types.js';

export type { CategoryOrderRow, LockedMenuItem, MenuItemFields } from './menu-write.types.js';

/** Every method runs on the caller's transaction. */
export abstract class MenuWriteRepository {
  /** Locks the category `FOR KEY SHARE`, so a concurrent delete waits for this write. */
  public abstract holdCategory(id: string): Promise<boolean>;
  /** Ids that are unknown or archived; the active ones are held `FOR KEY SHARE` (DR-024). */
  public abstract missingModifierGroups(ids: readonly string[]): Promise<string[]>;
  /** The caller picks `id`, so the photo can be copied to `menu/<id>/…` before the row exists. */
  public abstract insertItem(
    id: string,
    fields: MenuItemFields,
    variants: readonly MenuVariantInput[],
    groupIds: readonly string[],
  ): Promise<void>;
  public abstract lockItem(id: string): Promise<LockedMenuItem | null>;
  /**
   * Saves the item and its variant set: listed ids are updated and re-activated, new ones inserted,
   * the rest deactivated. Links of every active variant become `groupIds`. The item row is always
   * touched, so a variant-only or link-only edit still moves its `updated_at` (DR-023).
   */
  public abstract updateItem(
    id: string,
    fields: MenuItemFields,
    variants: readonly MenuVariantInput[],
    groupIds: readonly string[],
  ): Promise<void>;
  public abstract insertCategory(name: string): Promise<MenuCategoryRecord>;
  public abstract saveCategory(id: string, patch: { name?: string; isActive?: boolean }): Promise<MenuCategoryRecord | null>;
  /** All categories, active and hidden, locked `FOR UPDATE`, in the current order. */
  public abstract lockCategoryOrder(): Promise<CategoryOrderRow[]>;
  public abstract saveCategoryOrder(ids: readonly string[]): Promise<void>;
  /** Locks the category `FOR UPDATE`; null when it does not exist. */
  public abstract lockCategoryItemCount(id: string): Promise<number | null>;
  public abstract deleteCategory(id: string): Promise<void>;
}
