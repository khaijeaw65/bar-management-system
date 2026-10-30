import type { MenuItemVariant, UnavailableReason } from "@bar/contracts";

// What cart and item-sheet logic needs from a menu item — the POS `MenuItem` and the guest `CustomerMenuItem` both fit.
export interface OrderableItem {
  id: string;
  name: string;
  basePrice: string;
  isPromo: boolean;
  availableNow: boolean;
  unavailableReason: UnavailableReason | null;
  variants: readonly MenuItemVariant[];
}
