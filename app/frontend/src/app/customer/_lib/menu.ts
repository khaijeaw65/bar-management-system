import type { CustomerMenuCategory, CustomerMenuItem, CustomerPlaceOrder } from "@bar/contracts";
import type { CartLine } from "@/lib/order/cart";

export const ALL = "all";

export function hasOptions(item: CustomerMenuItem): boolean {
  return item.variants.length > 1 || item.variants.some((variant) => variant.modifierGroups.length > 0);
}

export function visibleItems(items: readonly CustomerMenuItem[], categoryId: string, query: string): CustomerMenuItem[] {
  const needle = query.trim();
  return items
    .filter((item) => categoryId === ALL || item.categoryId === categoryId)
    .filter((item) => needle.length === 0 || item.name.includes(needle));
}

export function sortedCategories(categories: readonly CustomerMenuCategory[]): CustomerMenuCategory[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

// Out of the window → when it starts; a live promo → when it ends (CD-06 §6).
export function windowNote(item: CustomerMenuItem): string | null {
  const window = item.windows[0];
  if (!window) return null;
  return item.availableNow ? `โปร · ถึง ${window.endTime}` : `โปร · เริ่ม ${window.startTime}`;
}

export function statusLabel(item: CustomerMenuItem): string | null {
  if (item.availableNow) return null;
  return item.unavailableReason === "out_of_window" ? (windowNote(item) ?? "โปร") : "หมด";
}

// A no-option item has one line at most per note; the sheet edits that one.
export function plainLine(lines: readonly CartLine[], itemId: string): CartLine | undefined {
  return lines.find((line) => line.itemId === itemId && !line.unavailable && line.modifierOptionIds.length === 0);
}

export function countInCart(lines: readonly CartLine[], itemId: string): number {
  return lines.filter((line) => line.itemId === itemId && !line.unavailable).reduce((sum, line) => sum + line.quantity, 0);
}

// The guest body carries no orderedByName — the server takes the session's nickname (DR-028).
export function customerBody(lines: readonly CartLine[]): CustomerPlaceOrder {
  return {
    items: lines
      .filter((line) => !line.unavailable)
      .map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
        modifierOptionIds: line.modifierOptionIds,
        notes: line.notes,
      })),
  };
}
