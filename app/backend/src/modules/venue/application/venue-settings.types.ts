import type { VenueSettings } from '@bar/contracts';

export interface StoredSettings {
  settings: VenueSettings;
  /** The cut-off this save replaced, or null when the cut-off did not change. */
  replacedCutoff: string | null;
  /** The `updated_at` the database stamped on the venue row (DR-023); null when nothing changed. */
  updatedAt: Date | null;
}
