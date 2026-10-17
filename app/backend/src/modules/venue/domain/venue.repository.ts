export interface VenueRecord {
  name: string;
  slug: string;
  kitchenDisplayEnabled: boolean;
  businessDayCutoff: string | Date;
  counterQrEnabled: boolean;
}

export interface VenueRepository {
  findTheVenue(): Promise<VenueRecord | null>;
}

export const VENUE_REPOSITORY = Symbol('VENUE_REPOSITORY');
