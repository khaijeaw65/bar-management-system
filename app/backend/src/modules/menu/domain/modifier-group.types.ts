import type { UpdateModifierGroup } from '@bar/contracts';

export interface ModifierGroupFields {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
}

/** `id` is set on PATCH for an existing option; omitted → a new one. */
export type ModifierOptionFields = UpdateModifierGroup['options'][number];
