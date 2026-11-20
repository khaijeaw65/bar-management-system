import { useQuery } from '@tanstack/react-query';
import { getTicketQueue } from '../lib/api/tickets';

export const QUEUE_KEY = ['tickets', 'queue'] as const;

export function useTicketQueue() {
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: getTicketQueue,
  });
}
