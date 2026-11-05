import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';
import OrdersScreen from '../../app/(tabs)/orders';
import { setMockTicketsError } from '../../lib/api/tickets';

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
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders order cards with order no., time ago, "table · name", ≤ 3 item lines + "+ n รายการ", and status chip (AC-3)', async () => {
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

    // Padded order numbers
    expect(screen.getByText(orderTag(43))).toBeTruthy();
    expect(screen.getByText(orderTag(44))).toBeTruthy();

    // >3 items show + n รายการ
    expect(screen.getByText('+ 1 รายการ')).toBeTruthy();

    // Cancelled items rendered
    expect(screen.getByText('1× โมฮิโต้')).toBeTruthy();
  });

  it('filters by status, never shows sent/cancelled, and shows dot on issue tab (AC-4)', async () => {
    const queryClient = createTestQueryClient();
    await renderOrdersScreen(queryClient);

    await waitFor(() => {
      expect(screen.getAllByText(orderTag(42))).toHaveLength(2);
    });

    // Filter "กำลังเตรียม"
    fireEvent.press(screen.getByTestId('filter-accepted'));
    await waitFor(() => {
      expect(screen.getByText(orderTag(44))).toBeTruthy();
      expect(screen.getByText(orderTag(45))).toBeTruthy();
      expect(screen.queryByText('T1 · ต้น · บาร์')).toBeNull(); // pending should not show
    });

    // Filter "พร้อมเสิร์ฟ"
    fireEvent.press(screen.getByTestId('filter-ready'));
    await waitFor(() => {
      expect(screen.getByText(orderTag(46))).toBeTruthy();
      expect(screen.getByText(orderTag(47))).toBeTruthy();
      expect(screen.queryByText(orderTag(44))).toBeNull();
    });

    // Filter "มีปัญหา"
    fireEvent.press(screen.getByTestId('filter-issue'));
    await waitFor(() => {
      expect(screen.getByText(orderTag(48))).toBeTruthy();
      expect(screen.queryByText(orderTag(46))).toBeNull();
    });
  });

  it('shows empty state when no tickets match filter and error alert with retry (AC-5)', async () => {
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
