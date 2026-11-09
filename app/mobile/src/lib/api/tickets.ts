import type { TicketList } from '@bar/contracts';
import { fetchMockTickets } from '../../mocks/tickets';

export async function getTicketQueue(): Promise<TicketList> {
  const useMocks = process.env.EXPO_PUBLIC_USE_MOCKS === '1';

  if (useMocks) {
    return fetchMockTickets();
  }

  throw new Error('API not wired — M3');
}
