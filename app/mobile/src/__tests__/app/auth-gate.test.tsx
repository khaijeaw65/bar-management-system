import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react-native';
import { AuthGate } from '../../app/_layout';
import { resetSession, signIn } from '../../lib/auth/session';

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

describe('AuthGate (AC-1, AC-2)', () => {
  beforeEach(() => {
    resetSession();
    mockReplace.mockClear();
    mockSegments = ['(tabs)'];
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to /login when no session exists and user is in (tabs)', async () => {
    await render(<AuthGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to /(tabs)/orders when session exists and user is on login', async () => {
    mockSegments = ['login'];
    await signIn({ delayMs: 0 });
    await render(<AuthGate />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders');
    });
  });
});

