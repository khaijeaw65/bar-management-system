import React from 'react';
import { render, waitFor, cleanup, screen, act } from '@testing-library/react-native';
import { AuthGate } from '../../components/auth/AuthGate';
import {
  resetSession,
  setSessionInitialized,
  signIn,
} from '../../lib/auth/session';
import { saveTokens, clearTokens } from '../../lib/auth/token-storage';
import { notifyAuthExpired } from '../../lib/api/client';
import * as authApi from '../../lib/api/auth';

const mockReplace = jest.fn();
let mockSegments: string[] = ['(tabs)'];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSegments: () => mockSegments,
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    {
      Screen: () => null,
    },
  ),
}));

describe('AuthGate & App Start (AC-7)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(async () => {
    resetSession();
    await clearTokens();
    mockReplace.mockClear();
    mockSegments = ['(tabs)'];
    process.env.EXPO_PUBLIC_USE_MOCKS = '0';
  });

  afterEach(async () => {
    cleanup();
    await clearTokens();
    resetSession();
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
    jest.restoreAllMocks();
  });

  it('AC-7: routes straight to /(tabs)/orders when saved tokens exist without login flash', async () => {
    await saveTokens({
      accessToken: 'valid-access-token',
      refreshToken: 'valid-refresh-token',
    });

    let resolveGetMe!: (val: { id: string; displayName: string; avatarUrl: null }) => void;
    jest.spyOn(authApi, 'getMe').mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGetMe = resolve;
      }),
    );

    setSessionInitialized(false);
    mockSegments = ['login'];

    await render(<AuthGate />);

    // Assert loading state is rendered during bootstrap (no login flash)
    expect(screen.getByTestId('auth-gate-loading')).toBeTruthy();

    await act(async () => {
      resolveGetMe({
        id: 'staff-uuid-1',
        displayName: 'บีม บาร์เทนเดอร์',
        avatarUrl: null,
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders');
    });
  });

  it('AC-7: routes to /login when no tokens exist on app start', async () => {
    setSessionInitialized(false);
    mockSegments = ['(tabs)'];

    await render(<AuthGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('AC-6: redirects to /login?reason=signed_out when session expires while in (tabs)', async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
    await signIn({ delayMs: 0 });
    mockSegments = ['(tabs)'];

    await render(<AuthGate />);

    // Trigger auth expiration (e.g. 401 refresh failure)
    await act(async () => {
      notifyAuthExpired();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?reason=signed_out');
    });
  });

  it('redirects to /(tabs)/orders when session exists and user visits /login', async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
    await signIn({ delayMs: 0 });
    mockSegments = ['login'];

    await render(<AuthGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders');
    });
  });
});
