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

export interface VenueRepository {
  findTheVenue(): Promise<VenueRecord | null>;
}

export const VENUE_REPOSITORY = Symbol('VENUE_REPOSITORY');
