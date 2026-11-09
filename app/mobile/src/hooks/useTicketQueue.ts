import { useQuery } from '@tanstack/react-query';
import { getTicketQueue } from '../lib/api/tickets';

export function useTicketQueue() {
  return useQuery({
    queryKey: ['tickets', 'queue'],
    queryFn: getTicketQueue,
  });
}
