import React from 'react';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';
import type { MyPermissions, Ticket, TicketList, VenueSettings } from '@bar/contracts';
import OrdersScreen from '../../app/(tabs)/orders';
import { apiClient, ApiError } from '../../lib/api/client';
import { getFreshMockTickets } from '../../mocks/tickets';
import { getMockVenue } from '../../mocks/venue';
import { getMockPermissions } from '../../mocks/permissions';

const mockShow = jest.fn();
jest.mock('heroui-native', () => ({
  ...jest.requireActual('heroui-native'),
  useToast: () => ({ toast: { show: mockShow, hide: jest.fn() }, isToastVisible: false }),
}));

const fixtures = getFreshMockTickets().items;
const byNumber = (n: number): Ticket => {
  const t = fixtures.find((x) => x.orderNumber === n);
  if (!t) throw new Error(`fixture #${n} missing`);
  return t;
};
const staffA = { staffId: '00000000-0000-4000-8000-0000000000aa', displayName: 'เอ' };
const staffBeam = { staffId: '00000000-0000-4000-8000-000000000001', displayName: 'บีม' };

let queue: TicketList;
let venue: VenueSettings;
let perms: MyPermissions;
let getSpy: jest.SpyInstance;
let postSpy: jest.SpyInstance;

function stubTransport(onPost: (url: string) => Promise<unknown>) {
  getSpy = jest.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
    if (url === '/tickets') return queue;
    if (url === '/venue') return venue;
    if (url === '/me/permissions') return perms;
    throw new Error(`unexpected GET ${url}`);
  });
  postSpy = jest.spyOn(apiClient, 'post').mockImplementation(onPost);
}

const calls = (spy: jest.SpyInstance, url: string) => spy.mock.calls.filter(([u]) => u === url).length;
const postedActions = () => postSpy.mock.calls.map(([u]) => String(u).split('/').pop());

async function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  await render(
    <HeroUINativeProvider>
      <QueryClientProvider client={client}>
        <OrdersScreen />
      </QueryClientProvider>
    </HeroUINativeProvider>,
  );
}

const actionButton = (t: Ticket) => screen.getByTestId(`ticket-action-${t.id}`);

describe('Orders queue on the real API — card actions (BRIEF-059)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '0';
    queue = { items: fixtures };
    venue = { ...getMockVenue(), kitchenDisplayEnabled: false };
    perms = getMockPermissions();
    mockShow.mockClear();
    stubTransport(async (url) => {
      throw new Error(`unexpected POST ${url}`);
    });
  });

  afterEach(() => {
    cleanup();
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
    jest.restoreAllMocks();
  });

  it('AC-1: loads GET /tickets?status=pending,accepted,ready,issue once and renders oldest first', async () => {
    await renderScreen();
    await waitFor(() => expect(screen.getByText('#0048')).toBeTruthy());
    expect(calls(getSpy, '/tickets')).toBe(1);
    expect(getSpy).toHaveBeenCalledWith('/tickets', { params: { status: 'pending,accepted,ready,issue' } });
    const order = screen.getAllByText(/^#00\d\d$/).map((n) => n.props.children);
    expect(order).toEqual(['#0048', '#0047', '#0046', '#0045', '#0044', '#0043', '#0042', '#0042']);
  });

  it('AC-2: kitchen off — รับออเดอร์ → /accept, then เสิร์ฟแล้ว → /send, Toast, card gone, never /ready', async () => {
    const pending = { ...byNumber(44), status: 'pending' as const, acceptedBy: null };
    queue = { items: [pending] };
    const accepted: Ticket = { ...pending, status: 'accepted', acceptedBy: staffBeam };
    const sent: Ticket = { ...accepted, status: 'sent', sentAt: new Date().toISOString() };
    stubTransport(async (url) => (url.endsWith('/accept') ? accepted : sent));

    await renderScreen();
    await waitFor(() => expect(within(actionButton(pending)).getByText('รับออเดอร์')).toBeTruthy());
    expect(screen.queryByTestId('filter-ready')).toBeNull();

    fireEvent.press(actionButton(pending));
    await waitFor(() => expect(screen.getByText('กำลังเตรียม · บีม')).toBeTruthy());
    expect(within(actionButton(pending)).getByText('เสิร์ฟแล้ว')).toBeTruthy();

    fireEvent.press(actionButton(pending));
    await waitFor(() => expect(screen.queryByText('#0044')).toBeNull());
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success', label: 'เสิร์ฟ #0044 แล้ว · T3' }),
    );
    expect(postedActions()).toEqual(['accept', 'send']);
  });

  it('AC-3: kitchen on — filter พร้อมเสิร์ฟ; accepted table = พร้อมแล้ว, accepted counter = เสิร์ฟแล้ว, ready = เสิร์ฟแล้ว', async () => {
    venue = { ...venue, kitchenDisplayEnabled: true };
    await renderScreen();
    await waitFor(() => expect(screen.getByTestId('filter-ready')).toBeTruthy());
    await waitFor(() => expect(within(actionButton(byNumber(44))).getByText('พร้อมแล้ว')).toBeTruthy());
    expect(byNumber(44).seat.kind).toBe('table');
    expect(byNumber(45).seat.kind).toBe('counter');
    expect(within(actionButton(byNumber(45))).getByText('เสิร์ฟแล้ว')).toBeTruthy();
    expect(within(actionButton(byNumber(46))).getByText('เสิร์ฟแล้ว')).toBeTruthy();
  });

  it('AC-4: a split order shows · บาร์ / · ครัว, a single-ticket order shows no station', async () => {
    await renderScreen();
    await waitFor(() => expect(screen.getByText('T1 · ต้น · บาร์')).toBeTruthy());
    expect(screen.getByText('T1 · ต้น · ครัว')).toBeTruthy();
    expect(screen.queryAllByText(/^T3.*(บาร์|ครัว)$/)).toHaveLength(0);
  });

  it('AC-5: 409 on accept, refetched ticket accepted by เอ → info Toast and the latest state, no second call', async () => {
    const pending = byNumber(43);
    stubTransport(async () => {
      queue = {
        items: fixtures.map((t) => (t.id === pending.id ? { ...t, status: 'accepted', acceptedBy: staffA } : t)),
      };
      throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'conflict');
    });

    await renderScreen();
    await waitFor(() => expect(actionButton(pending)).toBeTruthy());
    fireEvent.press(actionButton(pending));

    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'default',
          label: 'เอ รับออเดอร์ #0043 แล้ว',
          description: 'ไม่ต้องทำซ้ำ — ข้ามไปออเดอร์ถัดไปได้เลย',
        }),
      ),
    );
    await waitFor(() => expect(screen.getByText('กำลังเตรียม · เอ')).toBeTruthy());
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(calls(getSpy, '/tickets')).toBe(2);
  });

  it('AC-5: 409 where the refetched ticket is in another state → warning Toast', async () => {
    const pending = byNumber(43);
    stubTransport(async () => {
      queue = { items: fixtures.map((t) => (t.id === pending.id ? { ...t, status: 'issue' } : t)) };
      throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'conflict');
    });

    await renderScreen();
    await waitFor(() => expect(actionButton(pending)).toBeTruthy());
    fireEvent.press(actionButton(pending));

    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'warning', label: 'ออเดอร์นี้ถูกอัปเดตจากเครื่องอื่นแล้ว' }),
      ),
    );
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('AC-6: without orders:update_status no card has an action button and the read-only notice shows', async () => {
    perms = { ...perms, permissions: ['orders:read', 'venue:read'] };
    await renderScreen();
    await waitFor(() =>
      expect(screen.getByText('บัญชีนี้ดูคิวได้อย่างเดียว — เปลี่ยนสถานะไม่ได้ ให้ผู้จัดการตรวจสิทธิ์')).toBeTruthy(),
    );
    expect(screen.queryAllByTestId(/^ticket-action-/)).toHaveLength(0);
  });

  it('AC-6: a 403 from an action → warning Toast and refetch of permissions + queue', async () => {
    const pending = byNumber(43);
    stubTransport(async () => {
      throw new ApiError(403, 'FORBIDDEN', 'forbidden');
    });
    await renderScreen();
    await waitFor(() => expect(actionButton(pending)).toBeTruthy());
    expect(calls(getSpy, '/me/permissions')).toBe(1);
    expect(calls(getSpy, '/tickets')).toBe(1);

    fireEvent.press(actionButton(pending));
    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'warning',
          label: 'บัญชีนี้ดูคิวได้อย่างเดียว — เปลี่ยนสถานะไม่ได้ ให้ผู้จัดการตรวจสิทธิ์',
        }),
      ),
    );
    await waitFor(() => expect(calls(getSpy, '/me/permissions')).toBe(2));
    expect(calls(getSpy, '/tickets')).toBe(2);
  });

  it('a network failure → danger Toast, state unchanged', async () => {
    const pending = byNumber(43);
    stubTransport(async () => {
      throw new ApiError(0, 'NETWORK_ERROR', 'Network Error');
    });
    await renderScreen();
    await waitFor(() => expect(actionButton(pending)).toBeTruthy());
    fireEvent.press(actionButton(pending));
    await waitFor(() =>
      expect(mockShow).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger', label: 'บันทึกไม่สำเร็จ' })),
    );
    expect(within(actionButton(pending)).getByText('รับออเดอร์')).toBeTruthy();
  });

  it('AC-9: an issue ticket shows its chip and no action button', async () => {
    const issue = byNumber(48);
    await renderScreen();
    await waitFor(() => expect(actionButton(byNumber(43))).toBeTruthy());
    expect(screen.getAllByText('มีปัญหา').length).toBeGreaterThan(0);
    expect(screen.queryByTestId(`ticket-action-${issue.id}`)).toBeNull();
  });
});
