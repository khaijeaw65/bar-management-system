import React from 'react';
import { act, render, screen, waitFor, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';
import type { MyPermissions, Order, Ticket, TicketList, VenueSettings } from '@bar/contracts';
import TabsLayout from '../../app/(tabs)/_layout';
import OrdersScreen from '../../app/(tabs)/orders';
import { apiClient } from '../../lib/api/client';
import { saveTokens, clearTokens } from '../../lib/auth/token-storage';
import { getFreshMockTickets } from '../../mocks/tickets';
import { getMockVenue } from '../../mocks/venue';
import { getMockPermissions } from '../../mocks/permissions';
import type { FakeSocket } from '../../../test/fakeSocket';

const mockShow = jest.fn();
jest.mock('heroui-native', () => ({
  ...jest.requireActual('heroui-native'),
  useToast: () => ({ toast: { show: mockShow, hide: jest.fn() }, isToastVisible: false }),
}));

const mockSockets: FakeSocket[] = [];
jest.mock('socket.io-client', () => ({
  io: jest.fn((url: string, opts: { auth: Record<string, unknown> }) => {
    const { FakeSocket: Fake } = jest.requireActual<typeof import('../../../test/fakeSocket')>('../../../test/fakeSocket');
    const s = new Fake(url, opts);
    mockSockets.push(s);
    return s;
  }),
}));

jest.mock('lucide-react-native', () => ({ ClipboardList: () => null, Menu: () => null }));

/** Tabs stand-in: renders each screen's badge so the test can read it. */
jest.mock('expo-router', () => {
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => children;
  Tabs.Screen = function TabScreen({ name, options }: { name: string; options?: { tabBarBadge?: number } }) {
    return options?.tabBarBadge !== undefined ? <RNText testID={`badge-${name}`}>{options.tabBarBadge}</RNText> : null;
  };
  return { Tabs };
});

const fixtures = getFreshMockTickets().items;
let queue: TicketList;
const venue: VenueSettings = { ...getMockVenue(), kitchenDisplayEnabled: false };
const perms: MyPermissions = getMockPermissions();
let getSpy: jest.SpyInstance;

const ticketCalls = () => getSpy.mock.calls.filter(([u]) => u === '/tickets').length;
const socket = () => {
  const s = mockSockets[mockSockets.length - 1];
  if (!s) throw new Error('socket not created');
  return s;
};

function newTicket(): Ticket {
  const base = fixtures.find((t) => t.orderNumber === 43);
  if (!base) throw new Error('fixture missing');
  return {
    ...base,
    id: 'a0000001-0000-4000-8000-000000000099',
    orderId: '99999999-9999-4999-8999-999999999999',
    orderNumber: 49,
    seat: { ...base.seat, label: 'T9', kind: 'table' },
    createdAt: new Date().toISOString(),
  };
}

function orderPayload(ticket: Ticket): Order {
  return {
    id: ticket.orderId,
    visitId: '88888888-8888-4888-8888-888888888888',
    orderNumber: ticket.orderNumber,
    businessDate: '2026-11-20',
    createdAt: ticket.createdAt,
    createdBy: null,
    tickets: [ticket],
    total: '320.00',
  };
}

async function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const view = await render(
    <HeroUINativeProvider>
      <QueryClientProvider client={client}>
        <TabsLayout />
        <OrdersScreen />
      </QueryClientProvider>
    </HeroUINativeProvider>,
  );
  await waitFor(() => expect(mockSockets).toHaveLength(1));
  await act(async () => socket().fire('connect'));
  await waitFor(() => expect(screen.getByText('#0043')).toBeTruthy());
  return view;
}

describe('Orders queue live updates (AC-7, AC-8, AC-11)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '0';
    mockSockets.length = 0;
    mockShow.mockClear();
    queue = { items: fixtures };
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    getSpy = jest.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/tickets') return queue;
      if (url === '/venue') return venue;
      if (url === '/me/permissions') return perms;
      throw new Error(`unexpected GET ${url}`);
    });
  });

  afterEach(async () => {
    cleanup();
    await clearTokens();
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
    jest.restoreAllMocks();
  });

  it('AC-7: order.created refetches, highlights the new card, shows the Toast and the tab badge', async () => {
    await renderApp();
    const before = ticketCalls();
    const fresh = newTicket();
    queue = { items: [...fixtures, fresh] };

    await act(async () => socket().fire('order.created', orderPayload(fresh)));

    await waitFor(() => expect(screen.getByText('#0049')).toBeTruthy());
    expect(ticketCalls()).toBe(before + 1);
    expect(screen.getAllByTestId('order-card-highlighted')).toHaveLength(1);
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'ออเดอร์ใหม่ T9',
        description: `${fresh.items.length} รายการ · ต่อท้ายคิวแล้ว`,
      }),
    );
    expect(screen.getByTestId('badge-orders').props.children).toBe(1);

    // the highlight fades after ~3 s
    await waitFor(() => expect(screen.queryAllByTestId('order-card-highlighted')).toHaveLength(0), {
      timeout: 4500,
    });
  });

  it('AC-7: ticket.status_changed refetches without a Toast or highlight', async () => {
    await renderApp();
    const before = ticketCalls();
    await act(async () =>
      socket().fire('ticket.status_changed', { ticketId: fixtures[0]?.id, status: 'accepted' }),
    );
    await waitFor(() => expect(ticketCalls()).toBe(before + 1));
    expect(mockShow).not.toHaveBeenCalled();
    expect(screen.queryAllByTestId('order-card-highlighted')).toHaveLength(0);
    expect(screen.queryByTestId('badge-orders')).toBeNull();
  });

  it('AC-8: banner only after > 3 s disconnected; reconnect hides it and refetches', async () => {
    await renderApp();
    await act(async () => socket().fire('disconnect', 'transport close'));
    expect(screen.queryByText('การเชื่อมต่อขาด')).toBeNull();

    await waitFor(() => expect(screen.getByText('การเชื่อมต่อขาด')).toBeTruthy(), { timeout: 4500 });
    expect(screen.getByText('ข้อมูลอาจไม่อัปเดต กำลังเชื่อมต่อใหม่')).toBeTruthy();

    const before = ticketCalls();
    await act(async () => socket().fire('connect'));
    await waitFor(() => expect(screen.queryByText('การเชื่อมต่อขาด')).toBeNull());
    await waitFor(() => expect(ticketCalls()).toBe(before + 1));
  });

  it('logout (unmount) disconnects the socket', async () => {
    const view = await renderApp();
    const live = socket();
    await act(async () => view.unmount());
    expect(live.disconnect).toHaveBeenCalled();
  });

  it('AC-11: mock mode never creates a socket and never shows the banner', async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    await render(
      <HeroUINativeProvider>
        <QueryClientProvider client={client}>
          <TabsLayout />
          <OrdersScreen />
        </QueryClientProvider>
      </HeroUINativeProvider>,
    );
    await waitFor(() => expect(screen.getByText('#0043')).toBeTruthy());
    await new Promise((r) => setTimeout(r, 3200));
    expect(mockSockets).toHaveLength(0);
    expect(screen.queryByText('การเชื่อมต่อขาด')).toBeNull();
  }, 8000);
});
