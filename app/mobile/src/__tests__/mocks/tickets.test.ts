import { TicketListSchema } from '@bar/contracts';
import {
  mockTickets,
  transitionMockTicket,
  resetMockTickets,
  fetchMockTickets,
} from '../../mocks/tickets';
import { setMockKitchenDisplay } from '../../mocks/venue';

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

describe('mock ticket transitions mirror the server rule', () => {
  const pendingT1 = 'a0000001-0000-4000-8000-000000000001';
  const acceptedT3 = 'a0000001-0000-4000-8000-000000000004';

  beforeEach(() => {
    resetMockTickets();
    setMockKitchenDisplay(false);
  });

  it('accept sets acceptedBy and a second accept is a 409', async () => {
    const accepted = await transitionMockTicket(pendingT1, 'accept');
    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptedBy?.displayName).toBe('บีม');
    await expect(transitionMockTicket(pendingT1, 'accept')).rejects.toMatchObject({
      status: 409,
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  it('kitchen off: ready is refused, send from accepted removes the ticket from the queue', async () => {
    await expect(transitionMockTicket(acceptedT3, 'ready')).rejects.toMatchObject({ status: 409 });
    const sent = await transitionMockTicket(acceptedT3, 'send');
    expect(sent.status).toBe('sent');
    const queue = await fetchMockTickets();
    expect(queue.items.find((t) => t.id === acceptedT3)).toBeUndefined();
  });

  it('kitchen on: a table ticket goes accepted → ready', async () => {
    setMockKitchenDisplay(true);
    const ready = await transitionMockTicket(acceptedT3, 'ready');
    expect(ready.status).toBe('ready');
  });
});
