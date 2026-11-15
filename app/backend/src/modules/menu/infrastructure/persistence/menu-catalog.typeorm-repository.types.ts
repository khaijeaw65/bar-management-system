export interface ModifierRow {
  variantId: string;
  groupId: string;
  groupName: string;
  isRequired: boolean;
  minSelect: number | string;
  maxSelect: number | string;
  optionId: string | null;
  optionName: string | null;
  priceDelta: string | null;
  isAvailable: boolean | null;
}
