import type { ModifierGroupAdmin, UpdateModifierGroup } from '@bar/contracts';

export interface ModifierGroupFields {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
}

/** `id` is set on PATCH for an existing option; omitted → a new one. */
export type ModifierOptionFields = UpdateModifierGroup['options'][number];

/** Writes run on the caller's transaction (DR-024 locks). */
export interface ModifierGroupRepository {
  /** Active groups with every option (active and switched off), by name. */
  listActive(): Promise<ModifierGroupAdmin[]>;
  findActive(id: string): Promise<ModifierGroupAdmin | null>;
  /** Locks an active group `FOR UPDATE` and returns its option ids; null when archived or unknown. */
  lock(id: string): Promise<string[] | null>;
  insert(fields: ModifierGroupFields, options: readonly ModifierOptionFields[]): Promise<string>;
  /** Saves the group and its option set: listed ids updated and re-activated, new ones inserted, the rest switched off. */
  update(id: string, fields: ModifierGroupFields, options: readonly ModifierOptionFields[]): Promise<void>;
  /** Menu items whose active variants link the group. */
  linkedItemIds(id: string): Promise<string[]>;
  archive(id: string): Promise<void>;
}

export const MODIFIER_GROUP_REPOSITORY = Symbol('MODIFIER_GROUP_REPOSITORY');
