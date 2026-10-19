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

export interface StoredPromptPay {
  promptpayId: string;
  promptpayIdType: PromptpayIdType;
}

export interface VenueRepository {
  findTheVenue(): Promise<VenueRecord | null>;
  lockTheVenue(): Promise<LockedVenue | null>;
  savePromptPay(id: string, stored: StoredPromptPay): Promise<void>;
}

export const VENUE_REPOSITORY = Symbol('VENUE_REPOSITORY');
