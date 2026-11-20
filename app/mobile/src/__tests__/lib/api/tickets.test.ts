import { TicketSchema, VenueSettingsSchema, MyPermissionsSchema } from '@bar/contracts';
import { apiClient } from '../../../lib/api/client';
import { getTicketQueue, transitionTicket } from '../../../lib/api/tickets';
import { getVenue } from '../../../lib/api/venue';
import { getMyPermissions } from '../../../lib/api/me';
import { getFreshMockTickets } from '../../../mocks/tickets';
import { getMockVenue } from '../../../mocks/venue';
import { getMockPermissions } from '../../../mocks/permissions';

describe('tickets / venue / me API (real branch)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '0';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
    jest.restoreAllMocks();
  });

  it('AC-1: getTicketQueue calls GET /tickets with the queue statuses once and validates the list', async () => {
    const list = getFreshMockTickets();
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue(list);

    await expect(getTicketQueue()).resolves.toEqual(list);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/tickets', {
      params: { status: 'pending,accepted,ready,issue' },
    });
  });

  it('rejects a queue response that does not match TicketListSchema', async () => {
    jest.spyOn(apiClient, 'get').mockResolvedValue({ items: [{ id: 'nope' }] });
    await expect(getTicketQueue()).rejects.toThrow();
  });

  it.each(['accept', 'ready', 'send'] as const)(
    'transitionTicket(%s) posts to /tickets/:id/<action> and returns the parsed Ticket',
    async (action) => {
      const ticket = getFreshMockTickets().items[0];
      if (!ticket) throw new Error('fixture missing');
      const post = jest.spyOn(apiClient, 'post').mockResolvedValue(ticket);

      const result = await transitionTicket(ticket.id, action);

      expect(post).toHaveBeenCalledWith(`/tickets/${ticket.id}/${action}`);
      expect(TicketSchema.parse(result)).toEqual(ticket);
    },
  );

  it('getVenue calls GET /venue and validates VenueSettings', async () => {
    const venue = getMockVenue();
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue(venue);
    await expect(getVenue()).resolves.toEqual(venue);
    expect(get).toHaveBeenCalledWith('/venue');
  });

  it('getMyPermissions calls GET /me/permissions and validates MyPermissions', async () => {
    const perms = getMockPermissions();
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue(perms);
    await expect(getMyPermissions()).resolves.toEqual(perms);
    expect(get).toHaveBeenCalledWith('/me/permissions');
  });
});

describe('mock fixtures match the contracts', () => {
  it('venue and permissions fixtures pass their schemas', () => {
    expect(VenueSettingsSchema.safeParse(getMockVenue()).success).toBe(true);
    expect(MyPermissionsSchema.safeParse(getMockPermissions()).success).toBe(true);
  });
});
