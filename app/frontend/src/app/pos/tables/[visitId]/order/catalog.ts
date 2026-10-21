import type { MenuCategory, MenuItem, MenuItemVariant, MenuModifierGroup } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { lowestMoney, sumMoney } from "@/lib/utils/money";
import type { NewLine } from "./cart";

export function tilePrice(item: MenuItem): string {
  const prices = item.variants.map((variant) => variant.price);
  if (new Set(prices).size < 2) return formatTHB(item.basePrice);
  return `เริ่ม ${formatTHB(lowestMoney(prices))}`;
}

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

export function lineFrom(
  item: MenuItem,
  variant: MenuItemVariant,
  optionIds: readonly string[],
  orderedByName: string | null,
  notes: string | null,
  quantity: number,
): NewLine {
  const chosen = variant.modifierGroups
    .flatMap((group) => group.options)
    .filter((option) => optionIds.includes(option.id));
  const trimmed = notes?.trim() ?? "";
  return {
    itemId: item.id,
    itemName: item.name,
    variantId: variant.id,
    variantName: variant.name,
    modifierOptionIds: chosen.map((option) => option.id),
    modifierLabel: chosen.map((option) => option.name).join(" · "),
    orderedByName,
    notes: trimmed.length > 0 ? trimmed : null,
    quantity,
    unitPrice: sumMoney([variant.price, ...chosen.map((option) => option.priceDelta)]),
  };
}

export function groupMinimum(group: MenuModifierGroup): number {
  return group.isRequired ? Math.max(group.minSelect, 1) : group.minSelect;
}

export function groupCount(group: MenuModifierGroup, optionIds: readonly string[]): number {
  return group.options.filter((option) => optionIds.includes(option.id)).length;
}

export function selectionReady(variant: MenuItemVariant, optionIds: readonly string[]): boolean {
  return variant.modifierGroups.every((group) => {
    const count = groupCount(group, optionIds);
    return count >= groupMinimum(group) && count <= group.maxSelect;
  });
}

export function selectRadio(group: MenuModifierGroup, optionId: string, optionIds: readonly string[]): string[] {
  const ids = new Set(group.options.map((option) => option.id));
  return [...optionIds.filter((id) => !ids.has(id)), optionId];
}

export function toggleOption(group: MenuModifierGroup, optionId: string, optionIds: readonly string[]): string[] {
  const inGroup = new Set(group.options.map((option) => option.id));
  const current = optionIds.filter((id) => inGroup.has(id));
  if (current.includes(optionId)) return optionIds.filter((id) => id !== optionId);
  if (group.maxSelect > 0 && current.length >= group.maxSelect) return [...optionIds];
  return [...optionIds, optionId];
}
