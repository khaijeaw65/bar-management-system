import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useTicketQueue } from '../../hooks/useTicketQueue';
import { setMockTicketsError } from '../../mocks/tickets';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function QueryWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTicketQueue', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
    setMockTicketsError(false);
  });

  it('fetches tickets successfully from mock queue', async () => {
    const { result } = await renderHook(() => useTicketQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(8);
  });

  it('handles error state when ticket fetch fails', async () => {
    setMockTicketsError(true);
    const { result } = await renderHook(() => useTicketQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('โหลดออเดอร์ไม่สำเร็จ');
  });
});
