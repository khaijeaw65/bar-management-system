import {
  CreateMenuItemSchema,
  UpdateMenuItemSchema,
  type CreateMenuItem,
  type ItemType,
  type KitchenStation,
  type MenuItem,
  type UpdateMenuItem,
} from "@bar/contracts";

export interface VariantDraft {
  // Local row key; `id` is the server id of an existing price option.
  key: string;
  id?: string;
  name: string;
  price: string;
}

// keep = send no imageKey · remove = null · new = the tmp/ key of a finished upload (`preview` is a local blob URL).
export type PhotoDraft = { kind: "keep" } | { kind: "remove" } | { kind: "new"; key: string; preview: string };

export interface MenuDraft {
  name: string;
  categoryId: string;
  description: string;
  itemType: ItemType;
  station: KitchenStation | null;
  isPromo: boolean;
  variants: VariantDraft[];
  modifierGroupIds: string[];
  photo: PhotoDraft;
}

export type DraftErrors = Record<string, string>;

export interface Rename {
  kind: "item" | "option";
  from: string;
  to: string;
}

export const variantNameKey = (key: string) => `variant.${key}.name`;
export const variantPriceKey = (key: string) => `variant.${key}.price`;

export function newVariant(name = "", price = ""): VariantDraft {
  return { key: crypto.randomUUID(), name, price };
}

export function emptyDraft(): MenuDraft {
  return {
    name: "",
    categoryId: "",
    description: "",
    itemType: "simple",
    station: null,
    isPromo: false,
    variants: [newVariant("ปกติ")],
    modifierGroupIds: [],
    photo: { kind: "keep" },
  };
}

export function draftOf(item: MenuItem): MenuDraft {
  // Switched-off options stay out of the form: a listed id would put them back on sale (BRIEF-038).
  const active = item.variants.filter((variant) => variant.isAvailable);
  const groupIds = new Set(active.flatMap((variant) => variant.modifierGroups.map((group) => group.id)));
  return {
    name: item.name,
    categoryId: item.categoryId,
    description: item.description ?? "",
    itemType: item.itemType,
    station: item.station,
    isPromo: item.isPromo,
    variants: active.map((variant) => ({
      key: variant.id,
      id: variant.id,
      name: variant.name,
      price: variant.price,
    })),
    modifierGroupIds: [...groupIds],
    photo: { kind: "keep" },
  };
}

// "220" and "220.5" are what people type; the API wants two decimals.
export function normalizePrice(raw: string): string {
  const value = raw.trim();
  if (/^\d{1,8}$/.test(value)) return `${value}.00`;
  if (/^\d{1,8}\.\d$/.test(value)) return `${value}0`;
  return value;
}

function imageKeyOf(photo: PhotoDraft) {
  if (photo.kind === "new") return { imageKey: photo.key };
  return photo.kind === "remove" ? { imageKey: null } : {};
}

function payloadOf(draft: MenuDraft) {
  const charge = draft.itemType === "charge";
  return {
    categoryId: draft.categoryId,
    name: draft.name,
    description: draft.description.trim() || null,
    // สูตร saves as a plain item until recipes exist (CD-12 editor·6).
    itemType: draft.itemType === "recipe" ? ("simple" as const) : draft.itemType,
    station: charge ? null : draft.station,
    isPromo: draft.isPromo,
    variants: draft.variants.map((variant) => ({
      ...(variant.id ? { id: variant.id } : {}),
      name: variant.name,
      price: normalizePrice(variant.price),
    })),
    modifierGroupIds: draft.modifierGroupIds,
    ...imageKeyOf(draft.photo),
  };
}

function localErrors(draft: MenuDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.categoryId) errors.categoryId = "เลือกหมวด";
  if (draft.itemType !== "charge" && !draft.station) errors.station = "เลือกว่าจะส่งไปบาร์หรือครัว";
  for (const variant of draft.variants) {
    const price = variant.price.trim();
    if (!price) errors[variantPriceKey(variant.key)] = "กรุณาใส่ราคา";
    else if (price.startsWith("-")) errors[variantPriceKey(variant.key)] = "ราคาต้องไม่ติดลบ";
  }
  return errors;
}

function schemaErrors(draft: MenuDraft, issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): DraftErrors {
  const errors: DraftErrors = {};
  for (const issue of issues) {
    const [head, index, field] = issue.path;
    const row = typeof index === "number" ? draft.variants[index] : undefined;
    const key = head === "variants" && row && typeof field === "string" ? `variant.${row.key}.${field}` : String(head);
    errors[key] ??= issue.message;
  }
  return errors;
}

export type Validation =
  | { ok: true; payload: CreateMenuItem | UpdateMenuItem }
  | { ok: false; errors: DraftErrors };

// The same schemas as the API, so early feedback and the server cannot disagree (DR-004).
export function validate(draft: MenuDraft, updatedAt?: string): Validation {
  const body = payloadOf(draft);
  const parsed = updatedAt
    ? UpdateMenuItemSchema.safeParse({ ...body, updatedAt })
    : CreateMenuItemSchema.safeParse(body);
  const local = localErrors(draft);
  if (parsed.success && Object.keys(local).length === 0) return { ok: true, payload: parsed.data };
  const fromSchema = parsed.success ? {} : schemaErrors(draft, parsed.error.issues);
  return { ok: false, errors: { ...fromSchema, ...local } };
}

const comparable = (draft: MenuDraft) =>
  JSON.stringify({ ...draft, variants: draft.variants.map(({ id, name, price }) => ({ id, name, price })) });

export function isDirty(base: MenuDraft, draft: MenuDraft): boolean {
  return comparable(base) !== comparable(draft);
}

// DR-022: a renamed item or option keeps old orders on the old name — the manager confirms first.
export function renamesOf(base: MenuDraft, draft: MenuDraft): Rename[] {
  const renames: Rename[] = [];
  if (base.name.trim() !== draft.name.trim()) {
    renames.push({ kind: "item", from: base.name, to: draft.name.trim() });
  }
  for (const variant of draft.variants) {
    const before = base.variants.find((candidate) => candidate.id !== undefined && candidate.id === variant.id);
    if (before && before.name.trim() !== variant.name.trim()) {
      renames.push({ kind: "option", from: before.name, to: variant.name.trim() });
    }
  }
  return renames;
}
