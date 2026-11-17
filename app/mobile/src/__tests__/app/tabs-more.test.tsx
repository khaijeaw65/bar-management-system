import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HeroUINativeProvider } from 'heroui-native';
import MoreScreen from '../../app/(tabs)/more';
import { signIn, getSession, resetSession } from '../../lib/auth/session';
import { saveTokens, readTokens, clearTokens } from '../../lib/auth/token-storage';
import * as authApi from '../../lib/api/auth';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

async function renderWithProviders(ui: React.ReactElement) {
  return await render(<HeroUINativeProvider>{ui}</HeroUINativeProvider>);
}

describe('MoreScreen (AC-8)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(async () => {
    resetSession();
    await clearTokens();
    mockReplace.mockClear();
    alertSpy = jest.spyOn(Alert, 'alert');
    await signIn({ delayMs: 0 });
  });

  afterEach(async () => {
    cleanup();
    await clearTokens();
    resetSession();
    alertSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('renders staff name from session', async () => {
    await renderWithProviders(<MoreScreen />);
    expect(screen.getByText('อื่นๆ')).toBeTruthy();
    expect(screen.getByText('พนักงาน')).toBeTruthy();
    expect(screen.getByText('บีม')).toBeTruthy();
    expect(screen.getByText('ออกจากระบบ')).toBeTruthy();
  });

  it('AC-8: tapping ออกจากระบบ prompts confirmation alert with exact strings', async () => {
    await renderWithProviders(<MoreScreen />);
    const logoutButton = screen.getByText('ออกจากระบบ');

    fireEvent.press(logoutButton);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'ออกจากระบบ?',
      'เครื่องนี้จะไม่ได้รับการแจ้งเตือนออเดอร์จนกว่าจะเข้าสู่ระบบอีกครั้ง',
      expect.arrayContaining([
        expect.objectContaining({ text: 'ยกเลิก', style: 'cancel' }),
        expect.objectContaining({ text: 'ออกจากระบบ', style: 'destructive' }),
      ]),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(getSession()).not.toBeNull();
  });

  it('AC-8: confirming logout calls API with refresh token, clears tokens, and navigates to /login', async () => {
    await saveTokens({
      accessToken: 'sample-access-token',
      refreshToken: 'sample-refresh-token',
    });

    const logoutSpy = jest.spyOn(authApi, 'logout').mockResolvedValueOnce({ ok: true });

    await renderWithProviders(<MoreScreen />);
    const logoutButton = screen.getByText('ออกจากระบบ');
    fireEvent.press(logoutButton);

    const alertButtons = alertSpy.mock.calls[0]?.[2] as {
      text: string;
      onPress?: () => void;
    }[];
    const confirmButton = alertButtons.find((b) => b.text === 'ออกจากระบบ');
    expect(confirmButton).toBeDefined();

    confirmButton?.onPress?.();

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledWith('sample-refresh-token');
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    expect(getSession()).toBeNull();
    const remainingTokens = await readTokens();
    expect(remainingTokens).toBeNull();
  });

  it('AC-8: logout clears local tokens and navigates to /login even if API call fails', async () => {
    await saveTokens({
      accessToken: 'sample-access-token',
      refreshToken: 'sample-refresh-token',
    });

    jest.spyOn(authApi, 'logout').mockRejectedValueOnce(new Error('Network error'));

    await renderWithProviders(<MoreScreen />);
    const logoutButton = screen.getByText('ออกจากระบบ');
    fireEvent.press(logoutButton);

    const alertButtons = alertSpy.mock.calls[0]?.[2] as {
      text: string;
      onPress?: () => void;
    }[];
    const confirmButton = alertButtons.find((b) => b.text === 'ออกจากระบบ');

    confirmButton?.onPress?.();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    expect(getSession()).toBeNull();
    const remainingTokens = await readTokens();
    expect(remainingTokens).toBeNull();
  });
});
