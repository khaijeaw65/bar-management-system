import { TicketListSchema, TicketSchema, type Ticket, type TicketList } from '@bar/contracts';
import { apiClient } from './client';
import { fetchMockTickets, transitionMockTicket } from '../../mocks/tickets';

export type TicketTransition = 'accept' | 'ready' | 'send';

/** Statuses the bar queue shows — `sent` and `cancelled` never appear (CD-08 §9). */
export const QUEUE_STATUSES = 'pending,accepted,ready,issue';

function useMocks(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCKS === '1';
}

export async function getTicketQueue(): Promise<TicketList> {
  if (useMocks()) {
    return fetchMockTickets();
  }
  const data = await apiClient.get('/tickets', { params: { status: QUEUE_STATUSES } });
  return TicketListSchema.parse(data);
}

export async function transitionTicket(id: string, action: TicketTransition): Promise<Ticket> {
  if (useMocks()) {
    return transitionMockTicket(id, action);
  }
  const data = await apiClient.post(`/tickets/${id}/${action}`);
  return TicketSchema.parse(data);
}
