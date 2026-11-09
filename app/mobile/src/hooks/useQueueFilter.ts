import { useMemo, useState } from 'react';
import type { Ticket, TicketList } from '@bar/contracts';

export type FilterType = 'all' | 'pending' | 'accepted' | 'ready' | 'issue';

export function useQueueFilter(ticketList?: TicketList) {
  const [filter, setFilter] = useState<FilterType>('all');

  const { tickets, hasIssue } = useMemo(() => {
    const rawItems = ticketList?.items ?? [];

    // Oldest first FIFO sort (bartender works FIFO)
    const sorted = [...rawItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Exclude sent and cancelled orders from the queue
    const validTickets = sorted.filter(
      (t: Ticket) => t.status !== 'sent' && t.status !== 'cancelled',
    );

    const anyIssue = validTickets.some((t) => t.status === 'issue');

    const filtered =
      filter === 'all' ? validTickets : validTickets.filter((t) => t.status === filter);

    return { tickets: filtered, hasIssue: anyIssue };
  }, [ticketList, filter]);

  return { filter, setFilter, tickets, hasIssue };
}

