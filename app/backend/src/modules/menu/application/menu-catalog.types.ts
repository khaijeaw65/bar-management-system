import type {
  MenuItem,
  MenuModifierGroup,
  UnavailableReason,
} from '@bar/contracts';
import type { MenuItemRecord } from '../domain/menu.types.js';

export interface MenuListQuery {
  categoryId?: string;
  availableOnly: boolean;
  /** Hidden categories and their items too (back office, BRIEF-039). */
  includeHidden?: boolean;
}

export interface OrderableVariant {
  variantId: string;
  price: string;
  itemName: string;
  variantName: string;
  itemType: MenuItem['itemType'];
  kitchenTag: MenuItemRecord['kitchenTag'];
  availableNow: boolean;
  unavailableReason: UnavailableReason | null;
  modifierGroups: MenuModifierGroup[];
}

export interface OrderableLookup {
  found: OrderableVariant[];
  missing: string[];
}
