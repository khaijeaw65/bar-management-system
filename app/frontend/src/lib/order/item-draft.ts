import type { OrderableItem } from "./orderable";

export interface ItemDraft {
  variantId: string;
  optionIds: string[];
  who: string | null;
  notes: string;
  quantity: number;
  name: string;
  naming: boolean;
}

export type ItemDraftAction =
  | { type: "variant"; variantId: string }
  | { type: "options"; optionIds: string[] }
  | { type: "who"; name: string | null }
  | { type: "notes"; value: string }
  | { type: "quantity"; quantity: number }
  | { type: "name"; value: string }
  | { type: "naming"; open: boolean };

export function createItemDraft(item: OrderableItem): ItemDraft {
  const variant = item.variants.find((entry) => entry.isAvailable) ?? item.variants[0];
  return {
    variantId: variant?.id ?? "",
    optionIds: [],
    who: null,
    notes: "",
    quantity: 1,
    name: "",
    naming: false,
  };
}

export function itemDraftReducer(draft: ItemDraft, action: ItemDraftAction): ItemDraft {
  if (action.type === "variant") return { ...draft, variantId: action.variantId, optionIds: [] };
  if (action.type === "options") return { ...draft, optionIds: action.optionIds };
  if (action.type === "who") return { ...draft, who: action.name, naming: false, name: "" };
  if (action.type === "notes") return { ...draft, notes: action.value };
  if (action.type === "quantity") return { ...draft, quantity: Math.min(99, Math.max(1, action.quantity)) };
  if (action.type === "name") return { ...draft, name: action.value };
  return { ...draft, naming: action.open };
}
