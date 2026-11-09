import type {
  LockedVenue,
  LockedVenueSettings,
  StoredPromptPay,
  VenueRecord,
  VenueSettingsPatch,
} from './venue.types.js';

export type {
  BusinessDayRule,
  LockedVenue,
  LockedVenueSettings,
  StoredPromptPay,
  VenuePaymentAccount,
  VenueRecord,
  VenueSettingsPatch,
} from './venue.types.js';

export abstract class VenueRepository {
  public abstract findTheVenue(): Promise<VenueRecord | null>;
  public abstract lockTheVenue(): Promise<LockedVenue | null>;
  public abstract lockTheVenueShared(): Promise<LockedVenue | null>;
  public abstract lockTheVenueSettings(): Promise<LockedVenueSettings | null>;
  /** Returns the `updated_at` the database stamped on the row. */
  public abstract saveSettings(id: string, patch: VenueSettingsPatch): Promise<Date>;
  public abstract savePromptPay(id: string, stored: StoredPromptPay): Promise<void>;
}
