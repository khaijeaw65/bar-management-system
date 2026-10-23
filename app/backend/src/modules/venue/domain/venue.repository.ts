import type { PromptpayIdType, VenuePaymentMode } from '@bar/contracts';

export interface VenueRecord {
  name: string;
  slug: string;
  kitchenDisplayEnabled: boolean;
  businessDayCutoff: string | Date;
  counterQrEnabled: boolean;
  paymentMode: VenuePaymentMode;
  promptpayId: string | null;
  promptpayIdType: PromptpayIdType | null;
}

export interface VenuePaymentAccount {
  paymentMode: VenuePaymentMode;
  promptpayId: string | null;
  promptpayIdType: PromptpayIdType | null;
}

export interface LockedVenue extends VenuePaymentAccount {
  id: string;
}

export interface LockedVenueSettings {
  id: string;
  name: string;
  kitchenDisplayEnabled: boolean;
  businessDayCutoff: string;
  counterQrEnabled: boolean;
}

export type VenueSettingsPatch = Partial<Omit<LockedVenueSettings, 'id'>>;

export interface StoredPromptPay {
  promptpayId: string;
  promptpayIdType: PromptpayIdType;
}

export interface VenueRepository {
  findTheVenue(): Promise<VenueRecord | null>;
  lockTheVenue(): Promise<LockedVenue | null>;
  lockTheVenueShared(): Promise<LockedVenue | null>;
  lockTheVenueSettings(): Promise<LockedVenueSettings | null>;
  /** Returns the `updated_at` the database stamped on the row. */
  saveSettings(id: string, patch: VenueSettingsPatch): Promise<Date>;
  savePromptPay(id: string, stored: StoredPromptPay): Promise<void>;
}

export const VENUE_REPOSITORY = Symbol('VENUE_REPOSITORY');

/** The cut-off in force, plus the one it replaced while the business day open at the change is still running. */
export interface BusinessDayRule {
  cutoff: string;
  previous: { cutoff: string; changedAt: Date } | null;
}
