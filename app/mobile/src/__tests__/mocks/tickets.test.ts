import { TicketListSchema } from '@bar/contracts';
import { mockTickets } from '../../mocks/tickets';

describe('tickets mock fixtures (AC-6)', () => {
  it('passes TicketListSchema validation', () => {
    const result = TicketListSchema.safeParse(mockTickets);
    expect(result.success).toBe(true);
  });

  it('contains 8 tickets covering all queue statuses', () => {
    expect(mockTickets.items).toHaveLength(8);

    const statuses = new Set(mockTickets.items.map((t) => t.status));
    expect(statuses.has('pending')).toBe(true);
    expect(statuses.has('accepted')).toBe(true);
    expect(statuses.has('ready')).toBe(true);
    expect(statuses.has('issue')).toBe(true);

    // 1 order = 2 tickets (bar + food) sharing an orderId (DR-012)
    const orderIdCounts = mockTickets.items.reduce<Record<string, number>>((acc, t) => {
      acc[t.orderId] = (acc[t.orderId] || 0) + 1;
      return acc;
    }, {});
    const sharedOrderId = Object.keys(orderIdCounts).find((id) => orderIdCounts[id] === 2);
    expect(sharedOrderId).toBeDefined();

    const sharedTickets = mockTickets.items.filter((t) => t.orderId === sharedOrderId);
    const stations = sharedTickets.map((t) => t.station);
    expect(stations).toContain('bar');
    expect(stations).toContain('food');

    // 2 tickets with no orderedByName
    const withoutOrderedByName = mockTickets.items.filter((t) =>
      t.items.every((i) => i.orderedByName === null),
    );
    expect(withoutOrderedByName.length).toBeGreaterThanOrEqual(2);

    // 1 ticket with a cancelled line
    const withCancelledLine = mockTickets.items.filter((t) =>
      t.items.some((i) => i.cancelledAt !== null && i.cancellation !== null),
    );
    expect(withCancelledLine.length).toBeGreaterThanOrEqual(1);

    // 1 issue ticket with issue filled
    const withIssue = mockTickets.items.filter((t) => t.issue !== null);
    expect(withIssue.length).toBeGreaterThanOrEqual(1);
  });
});
