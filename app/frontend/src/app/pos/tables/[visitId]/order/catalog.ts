import type { MenuCategory, MenuItem, MenuItemVariant } from "@bar/contracts";

export function unavailableLabel(item: MenuItem): string | null {
  if (item.availableNow) return null;
  if (item.unavailableReason !== "out_of_window") return "หมด";
  const start = item.windows[0]?.startTime;
  return start ? `โปร · เริ่ม ${start}` : "โปร";
}

export function quickVariant(item: MenuItem): MenuItemVariant | null {
  if (!item.availableNow || item.itemType === "charge") return null;
  const available = item.variants.filter((variant) => variant.isAvailable);
  if (available.length !== 1) return null;
  const variant = available[0];
  if (!variant) return null;
  const required = variant.modifierGroups.some((group) => group.isRequired || group.minSelect > 0);
  return required ? null : variant;
}

export function visibleItems(items: readonly MenuItem[], categoryId: string, query: string): MenuItem[] {
  const needle = query.trim();
  return items
    .filter((item) => item.itemType !== "charge")
    .filter((item) => categoryId === "all" || item.categoryId === categoryId)
    .filter((item) => needle.length === 0 || item.name.includes(needle))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th"));
}

export function sortedCategories(categories: readonly MenuCategory[]): MenuCategory[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
}
