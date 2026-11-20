import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useVenue } from '../../hooks/useVenue';
import { useMyPermissions } from '../../hooks/useMyPermissions';
import { setMockKitchenDisplay } from '../../mocks/venue';
import { resetMockPermissions, setMockPermissions } from '../../mocks/permissions';
import * as meApi from '../../lib/api/me';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useVenue / useMyPermissions', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
    setMockKitchenDisplay(false);
    resetMockPermissions();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('useVenue returns the venue mode from mocks', async () => {
    setMockKitchenDisplay(true);
    const { result } = await renderHook(() => useVenue(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data?.kitchenDisplayEnabled).toBe(true));
  });

  it('useMyPermissions derives canUpdateStatus from the permission list', async () => {
    const { result } = await renderHook(() => useMyPermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.canUpdateStatus).toBe(true));

    setMockPermissions(['orders:read']);
    const second = await renderHook(() => useMyPermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(second.result.current.canUpdateStatus).toBe(false);
  });

  it('refetches permissions when the app returns to the foreground', async () => {
    let onChange: ((s: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      onChange = listener;
      return { remove: jest.fn() };
    });
    const spy = jest.spyOn(meApi, 'getMyPermissions');
    const { result } = await renderHook(() => useMyPermissions(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      onChange?.('active');
    });
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  });
});
