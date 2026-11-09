import type { ItemType, KitchenStation } from '@bar/contracts';

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
