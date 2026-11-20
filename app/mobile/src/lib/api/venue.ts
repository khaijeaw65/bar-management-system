import { VenueSettingsSchema, type VenueSettings } from '@bar/contracts';
import { apiClient } from './client';
import { fetchMockVenue } from '../../mocks/venue';

export async function getVenue(): Promise<VenueSettings> {
  if (process.env.EXPO_PUBLIC_USE_MOCKS === '1') {
    return fetchMockVenue();
  }
  const data = await apiClient.get('/venue');
  return VenueSettingsSchema.parse(data);
}
