import { renderHook, act } from '@testing-library/react-native';
import { useQueueFilter } from '../../hooks/useQueueFilter';
import type { Ticket, TicketList } from '@bar/contracts';

function makeTicket(
  id: string,
  orderNumber: number,
  status: Ticket['status'],
  createdAt: string,
): Ticket {
  return {
    id,
    orderId: '00000000-0000-0000-0000-000000000000',
    orderNumber,
    station: 'bar',
    status,
    seat: { id: 's1', label: 'T1', kind: 'table' },
    items: [],
    issue: null,
    acceptedBy: null,
    sentAt: null,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('useQueueFilter (AC-3, AC-4)', () => {
  it('sorts tickets oldest-first FIFO even if input is unsorted (AC-3)', async () => {
    const unsortedList: TicketList = {
      items: [
        makeTicket('3', 3, 'pending', '2026-11-09T10:30:00Z'),
        makeTicket('1', 1, 'pending', '2026-11-09T10:10:00Z'),
        makeTicket('2', 2, 'pending', '2026-11-09T10:20:00Z'),
      ],
    };

    const { result } = await renderHook(() => useQueueFilter(unsortedList));

    // Oldest (10:10) -> (10:20) -> (10:30)
    expect(result.current.tickets.map((t) => t.orderNumber)).toEqual([1, 2, 3]);
  });

  it('excludes sent and cancelled tickets from queue (AC-4)', async () => {
    const listWithExcluded: TicketList = {
      items: [
        makeTicket('1', 1, 'pending', '2026-11-09T10:10:00Z'),
        makeTicket('2', 2, 'sent', '2026-11-09T10:15:00Z'),
        makeTicket('3', 3, 'cancelled', '2026-11-09T10:20:00Z'),
        makeTicket('4', 4, 'ready', '2026-11-09T10:25:00Z'),
      ],
    };

    const { result } = await renderHook(() => useQueueFilter(listWithExcluded));

    expect(result.current.tickets.map((t) => t.orderNumber)).toEqual([1, 4]);
  });

  it('detects hasIssue when an issue ticket exists (AC-4)', async () => {
    const listWithIssue: TicketList = {
      items: [
        makeTicket('1', 1, 'pending', '2026-11-09T10:10:00Z'),
        makeTicket('2', 2, 'issue', '2026-11-09T10:15:00Z'),
      ],
    };

    const { result } = await renderHook(() => useQueueFilter(listWithIssue));
    expect(result.current.hasIssue).toBe(true);

    await act(async () => {
      result.current.setFilter('ready');
    });

    expect(result.current.tickets).toHaveLength(0);
  });
});
