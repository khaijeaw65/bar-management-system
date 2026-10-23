import type { MenuItem } from "@bar/contracts";

// Trimmed substring on the Thai name; combines with the single-select category chip ("all" = every category).
export function filterItems(items: MenuItem[], query: string, categoryId: string): MenuItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (categoryId === "all" || item.categoryId === categoryId) && item.name.toLowerCase().includes(needle),
  );
}
