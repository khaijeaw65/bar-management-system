import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';
import OrdersScreen from '../../app/(tabs)/orders';
import { setMockTicketsError, setMockDelayMs } from '../../mocks/tickets';
import * as api from '../../lib/api/tickets';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

async function renderOrdersScreen(queryClient: QueryClient) {
  return await render(
    <HeroUINativeProvider>
      <QueryClientProvider client={queryClient}>
        <OrdersScreen />
      </QueryClientProvider>
    </HeroUINativeProvider>,
  );
}

const orderTag = (n: number) => `#${String(n).padStart(4, '0')}`;

describe('OrdersScreen (AC-3, AC-4, AC-5)', () => {
  beforeEach(() => {
    setMockTicketsError(false);
    setMockDelayMs(0);
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('shows Skeletons ×4 during loading phase (AC-3)', async () => {
    // Set simulated delay so loading state can be observed
    setMockDelayMs(80);
    const queryClient = createTestQueryClient();
    await renderOrdersScreen(queryClient);

    expect(screen.getByTestId('orders-loading')).toBeTruthy();
    expect(screen.getAllByTestId('order-skeleton')).toHaveLength(4);

    // After delay finishes, cards are visible
    await waitFor(() => {
      expect(screen.getAllByText(orderTag(42))).toHaveLength(2);
    });
  });

  it('renders order cards with order no., time ago, "table · name", ≤ 3 item lines + "+ n รายการ", status chip, and strike-through on cancelled items (AC-3)', async () => {
    const queryClient = createTestQueryClient();
    await renderOrdersScreen(queryClient);

    expect(screen.getByText('ออเดอร์')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByText(orderTag(42))).toHaveLength(2);
      expect(screen.getByText('T1 · ต้น · บาร์')).toBeTruthy();
      expect(screen.getByText('T1 · ต้น · ครัว')).toBeTruthy();
      expect(screen.getByText('2× ช้างดราฟต์')).toBeTruthy();
      expect(screen.getAllByText('ใหม่')).toHaveLength(4); // 1 filter tab + 3 card chips
    });

    // Padded order numbers in oldest-first order
    expect(screen.getByText(orderTag(43))).toBeTruthy();
    expect(screen.getByText(orderTag(44))).toBeTruthy();
    expect(screen.getByText(orderTag(45))).toBeTruthy();
    expect(screen.getByText(orderTag(46))).toBeTruthy();
    expect(screen.getByText(orderTag(47))).toBeTruthy();
    expect(screen.getByText(orderTag(48))).toBeTruthy();

    // Time ago strings exist
    expect(screen.getAllByText(/\d+ (นาที|ชม\.)ที่แล้ว|เมื่อกี้/).length).toBeGreaterThan(0);

    // >3 items show + n รายการ
    expect(screen.getByText('+ 1 รายการ')).toBeTruthy();

    // Cancelled item rendered with strike-through
    const cancelledItem = screen.getByTestId('cancelled-order-item');
    expect(cancelledItem).toBeTruthy();
    expect(cancelledItem.props.className).toContain('line-through');
  });

  it('filters by status, never shows sent/cancelled, and shows dot on issue tab (AC-4)', async () => {
    // Inject sent and cancelled items to verify they are never shown
    const originalGetQueue = api.getTicketQueue;
    jest.spyOn(api, 'getTicketQueue').mockImplementation(async () => {
      const res = await originalGetQueue();
      return {
        items: [
          ...res.items,
          {
            id: 'sent-1',
            orderId: 'sent-id',
            orderNumber: 99,
            station: 'bar',
            status: 'sent',
            seat: { id: 's99', label: 'T99', kind: 'table' },
            items: [],
            issue: null,
            acceptedBy: null,
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'cancelled-1',
            orderId: 'cancelled-id',
            orderNumber: 98,
            station: 'bar',
            status: 'cancelled',
            seat: { id: 's98', label: 'T98', kind: 'table' },
            items: [],
            issue: null,
            acceptedBy: null,
            sentAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });

    const queryClient = createTestQueryClient();
    await renderOrdersScreen(queryClient);

    await waitFor(() => {
      expect(screen.getAllByText(orderTag(42))).toHaveLength(2);
    });

    // sent and cancelled are excluded
    expect(screen.queryByText(orderTag(99))).toBeNull();
    expect(screen.queryByText(orderTag(98))).toBeNull();

    // Issue dot indicator is visible on issue tab
    expect(screen.getByTestId('issue-dot')).toBeTruthy();

    // Filter "ใหม่" (pending)
    fireEvent.press(screen.getByTestId('filter-pending'));
    await waitFor(() => {
      expect(screen.getAllByText(orderTag(42))).toHaveLength(2);
      expect(screen.getByText(orderTag(43))).toBeTruthy();
      expect(screen.queryByText(orderTag(44))).toBeNull(); // accepted
    });

    // Filter "กำลังเตรียม" (accepted)
    fireEvent.press(screen.getByTestId('filter-accepted'));
    await waitFor(() => {
      expect(screen.getByText(orderTag(44))).toBeTruthy();
      expect(screen.getByText(orderTag(45))).toBeTruthy();
      expect(screen.queryByText('T1 · ต้น · บาร์')).toBeNull(); // pending should not show
    });

    // Filter "พร้อมเสิร์ฟ" (ready)
    fireEvent.press(screen.getByTestId('filter-ready'));
    await waitFor(() => {
      expect(screen.getByText(orderTag(46))).toBeTruthy();
      expect(screen.getByText(orderTag(47))).toBeTruthy();
      expect(screen.queryByText(orderTag(44))).toBeNull();
    });

    // Filter "มีปัญหา" (issue)
    fireEvent.press(screen.getByTestId('filter-issue'));
    await waitFor(() => {
      expect(screen.getByText(orderTag(48))).toBeTruthy();
      expect(screen.queryByText(orderTag(46))).toBeNull();
    });
  });

  it('shows empty state "ยังไม่มีออเดอร์" when no orders match (AC-5)', async () => {
    jest.spyOn(api, 'getTicketQueue').mockResolvedValue({ items: [] });
    const queryClient = createTestQueryClient();
    await renderOrdersScreen(queryClient);

    await waitFor(() => {
      expect(screen.getByText('ยังไม่มีออเดอร์')).toBeTruthy();
    });
  });

  it('shows error alert with retry button when mock fails (AC-5)', async () => {
    setMockTicketsError(true);
    const queryClient = createTestQueryClient();
    await renderOrdersScreen(queryClient);

    await waitFor(() => {
      expect(screen.getByText('โหลดออเดอร์ไม่สำเร็จ')).toBeTruthy();
      expect(screen.getByText('ลองอีกครั้ง')).toBeTruthy();
    });

    // Click retry with error cleared
    setMockTicketsError(false);
    fireEvent.press(screen.getByText('ลองอีกครั้ง'));

    await waitFor(() => {
      expect(screen.getAllByText(orderTag(42))).toHaveLength(2);
    });
  });
});
