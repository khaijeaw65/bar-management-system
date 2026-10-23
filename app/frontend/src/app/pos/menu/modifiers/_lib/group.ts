import {
  CreateModifierGroupSchema,
  UpdateModifierGroupSchema,
  type CreateModifierGroup,
  type ModifierGroupAdmin,
  type UpdateModifierGroup,
} from "@bar/contracts";
import { normalizePrice } from "../../_lib/draft";

export interface OptionDraft {
  key: string;
  // Server id of an existing option; new rows have none (and may be trashed).
  id?: string;
  name: string;
  priceDelta: string;
  // The "ขาย" switch: off = left out of the PATCH (the API switches it off).
  on: boolean;
}

export interface GroupDraft {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: OptionDraft[];
}

export type GroupErrors = Record<string, string>;

export const optionNameKey = (key: string) => `option.${key}.name`;
export const optionPriceKey = (key: string) => `option.${key}.priceDelta`;

export function newOption(): OptionDraft {
  return { key: crypto.randomUUID(), name: "", priceDelta: "0", on: true };
}

export function emptyGroup(): GroupDraft {
  return { name: "", isRequired: false, minSelect: 0, maxSelect: 1, options: [newOption()] };
}

export function groupDraftOf(group: ModifierGroupAdmin): GroupDraft {
  return {
    name: group.name,
    isRequired: group.isRequired,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: group.options.map((option) => ({
      key: option.id,
      id: option.id,
      name: option.name,
      priceDelta: option.priceDelta,
      on: option.isAvailable,
    })),
  };
}

// Same wording as the order sheet chip (CD-04 F4): "ต้องเลือก 1" / "ไม่บังคับ · สูงสุด 2".
export function ruleLabel(rule: Pick<GroupDraft, "isRequired" | "minSelect" | "maxSelect">): string {
  if (!rule.isRequired) return `ไม่บังคับ · สูงสุด ${rule.maxSelect}`;
  return rule.minSelect === rule.maxSelect ? `ต้องเลือก ${rule.minSelect}` : `ต้องเลือก ${rule.minSelect}–${rule.maxSelect}`;
}

export const activeCount = (group: Pick<GroupDraft, "options">) => group.options.filter((option) => option.on).length;

function payloadOf(draft: GroupDraft) {
  return {
    name: draft.name,
    isRequired: draft.isRequired,
    minSelect: draft.isRequired ? draft.minSelect : 0,
    maxSelect: draft.maxSelect,
    options: draft.options
      .filter((option) => option.on)
      .map((option) => ({
        ...(option.id ? { id: option.id } : {}),
        name: option.name,
        priceDelta: normalizePrice(option.priceDelta.trim() || "0"),
      })),
  };
}

function errorsOf(draft: GroupDraft, issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): GroupErrors {
  const on = draft.options.filter((option) => option.on);
  const errors: GroupErrors = {};
  for (const issue of issues) {
    const [head, index, field] = issue.path;
    const row = typeof index === "number" ? on[index] : undefined;
    const key = head === "options" && row && typeof field === "string" ? `option.${row.key}.${field}` : String(head);
    errors[key] ??= issue.message;
  }
  for (const option of draft.options) {
    if (option.on && option.priceDelta.trim().startsWith("-")) errors[optionPriceKey(option.key)] = "ราคาต้องไม่ติดลบ";
  }
  return errors;
}

export type GroupValidation =
  | { ok: true; payload: CreateModifierGroup | UpdateModifierGroup }
  | { ok: false; errors: GroupErrors };

// The same schemas as the API (DR-004); `editing` picks the PATCH shape that carries option ids.
export function validateGroup(draft: GroupDraft, editing: boolean): GroupValidation {
  const schema = editing ? UpdateModifierGroupSchema : CreateModifierGroupSchema;
  const parsed = schema.safeParse(payloadOf(draft));
  const errors = errorsOf(draft, parsed.success ? [] : parsed.error.issues);
  if (parsed.success && Object.keys(errors).length === 0) return { ok: true, payload: parsed.data };
  return { ok: false, errors };
}

export function isGroupDirty(base: GroupDraft, draft: GroupDraft): boolean {
  const flat = (value: GroupDraft) =>
    JSON.stringify({ ...value, options: value.options.map(({ id, name, priceDelta, on }) => ({ id, name, priceDelta, on })) });
  return flat(base) !== flat(draft);
}
