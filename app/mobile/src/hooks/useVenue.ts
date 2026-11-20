import { useQuery } from '@tanstack/react-query';
import { getVenue } from '../lib/api/venue';

const FIVE_MINUTES = 5 * 60 * 1000;

/** Venue mode (kitchen screen on/off) — cached 5 min (brief §7). */
export function useVenue() {
  return useQuery({ queryKey: ['venue'], queryFn: getVenue, staleTime: FIVE_MINUTES });
}
