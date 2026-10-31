import type { ModifierGroupAdmin } from '@bar/contracts';
import type { ModifierGroupFields, ModifierOptionFields } from './modifier-group.types.js';

export type { ModifierGroupFields, ModifierOptionFields } from './modifier-group.types.js';

/** Writes run on the caller's transaction (DR-024 locks). */
export abstract class ModifierGroupRepository {
  /** Active groups with every option (active and switched off), by name. */
  public abstract listActive(): Promise<ModifierGroupAdmin[]>;
  public abstract findActive(id: string): Promise<ModifierGroupAdmin | null>;
  /** Locks an active group `FOR UPDATE` and returns its option ids; null when archived or unknown. */
  public abstract lock(id: string): Promise<string[] | null>;
  public abstract insert(fields: ModifierGroupFields, options: readonly ModifierOptionFields[]): Promise<string>;
  /** Saves the group and its option set: listed ids updated and re-activated, new ones inserted, the rest switched off. */
  public abstract update(id: string, fields: ModifierGroupFields, options: readonly ModifierOptionFields[]): Promise<void>;
  /** Menu items whose active variants link the group. */
  public abstract linkedItemIds(id: string): Promise<string[]>;
  public abstract archive(id: string): Promise<void>;
}
