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

/** The cut-off in force, plus the one it replaced while the business day open at the change is still running. */
export interface BusinessDayRule {
  cutoff: string;
  previous: { cutoff: string; changedAt: Date } | null;
}
