import type { VenueSettings } from '@bar/contracts';

let kitchenDisplayEnabled = false;

/** DR-014 #1: the kitchen screen is off by default (S1). */
export function setMockKitchenDisplay(enabled: boolean): void {
  kitchenDisplayEnabled = enabled;
}

export function getMockVenue(): VenueSettings {
  return {
    name: 'The Loft Bar',
    slug: 'the-loft-bar',
    kitchenDisplayEnabled,
    businessDayCutoff: '05:00',
    counterQrEnabled: true,
  };
}

export async function fetchMockVenue(): Promise<VenueSettings> {
  return getMockVenue();
}
