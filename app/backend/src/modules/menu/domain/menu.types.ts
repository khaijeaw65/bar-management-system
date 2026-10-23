import type { ItemType, KitchenStation } from '@bar/contracts';

export interface MenuOptionRecord {
  id: string;
  name: string;
  priceDelta: string;
  isAvailable: boolean;
}

export interface MenuGroupRecord {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuOptionRecord[];
}

export interface MenuVariantRecord {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
  modifierGroups: MenuGroupRecord[];
}

export interface MenuWindowRecord {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface MenuItemRecord {
  id: string;
  categoryId: string;
  categoryActive: boolean;
  name: string;
  description: string | null;
  /** S3 object key (`menu/<itemId>/…`); the catalog turns it into a presigned URL. */
  imageKey: string | null;
  basePrice: string;
  itemType: ItemType;
  kitchenTag: KitchenStation | null;
  isAvailable: boolean;
  isPromo: boolean;
  sortOrder: number;
  updatedAt: Date;
  windows: MenuWindowRecord[];
  variants: MenuVariantRecord[];
}

export interface MenuCategoryRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
