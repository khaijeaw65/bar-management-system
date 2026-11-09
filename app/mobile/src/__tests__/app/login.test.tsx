import React from 'react';
import crypto from 'node:crypto';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import * as WebBrowser from 'expo-web-browser';
import LoginScreen from '../../app/login';
import {
  resetSession,
  setMockSignInShouldFail,
  setMockSignInDelayMs,
  getSession,
} from '../../lib/auth/session';
import { readTokens } from '../../lib/auth/token-storage';
import * as authApi from '../../lib/api/auth';

const mockReplace = jest.fn();
let mockSearchParams: { reason?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

async function renderWithProviders(ui: React.ReactElement) {
  return await render(<HeroUINativeProvider>{ui}</HeroUINativeProvider>);
}

describe('LoginScreen (AC-2, AC-3, AC-4, CD-08 states 1–5)', () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCKS;

  beforeEach(() => {
    resetSession();
    setMockSignInDelayMs(0);
    mockReplace.mockClear();
    mockSearchParams = {};
    process.env.EXPO_PUBLIC_USE_MOCKS = '1';
  });

  afterEach(() => {
    cleanup();
    process.env.EXPO_PUBLIC_USE_MOCKS = originalEnv;
    jest.restoreAllMocks();
  });

  it('State 1 (default): renders initial login screen elements', async () => {
    await renderWithProviders(<LoginScreen />);
    expect(screen.getByText('The Loft Bar')).toBeTruthy();
    expect(screen.getByText('ระบบจัดการบาร์')).toBeTruthy();
    expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeTruthy();
    expect(screen.getByText('เฉพาะพนักงาน The Loft Bar')).toBeTruthy();
  });

  it('State 2 (signing in): shows spinner and text while signing in (mock flow)', async () => {
    setMockSignInDelayMs(80);
    await renderWithProviders(<LoginScreen />);
    const loginButton = screen.getByTestId('login-button');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-spinner')).toBeTruthy();
      expect(screen.getByText('กำลังเปิด LINE เพื่อยืนยันตัวตน')).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders');
    });
    expect(getSession()?.staffName).toBe('บีม');
  });

  it('State 3 (failed): shows failure Alert and "ลองอีกครั้ง" button on login failure', async () => {
    setMockSignInShouldFail(true);
    await renderWithProviders(<LoginScreen />);
    const loginButton = screen.getByTestId('login-button');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ')).toBeTruthy();
      expect(
        screen.getByText('ลองอีกครั้ง หากยังไม่ได้ ให้ตรวจว่าเปิดแอป LINE ในเครื่องนี้แล้ว'),
      ).toBeTruthy();
      expect(screen.getByText('ลองอีกครั้ง')).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('State 5 (signed out): renders CD-08 state 5 when reason=signed_out', async () => {
    mockSearchParams = { reason: 'signed_out' };
    await renderWithProviders(<LoginScreen />);

    expect(screen.getByText('ออกจากระบบแล้ว')).toBeTruthy();
    expect(
      screen.getByText(
        'เข้าสู่ระบบอีกครั้งเพื่อทำงานต่อ — เกิดเมื่อออกจากระบบเอง เจ้าของร้านถอนสิทธิ์เครื่องนี้ หรือไม่ได้เปิดแอปเกิน 30 วัน',
      ),
    ).toBeTruthy();
    expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeTruthy();
  });

  describe('Real LINE Login with PKCE & WebBrowser (AC-2, AC-3, AC-4)', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_USE_MOCKS = '0';
      process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3011/api';
    });

    it('AC-2: browser returns code → exchanges token with code + PKCE verifier, saves to SecureStore, routes to orders', async () => {
      const openAuthSpy = jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: 'success',
        url: 'barapp://auth?code=mock-auth-code',
      });

      const exchangeSpy = jest.spyOn(authApi, 'exchangeCode').mockResolvedValueOnce({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 3600,
      });

      jest.spyOn(authApi, 'getMe').mockResolvedValueOnce({
        id: 'staff-uuid-1',
        displayName: 'พนักงานกานต์',
        avatarUrl: null,
      });

      await renderWithProviders(<LoginScreen />);
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders');
      });

      expect(exchangeSpy).toHaveBeenCalledTimes(1);
      const [receivedCode, receivedVerifier] = exchangeSpy.mock.calls[0] ?? [];
      expect(receivedCode).toBe('mock-auth-code');
      expect(typeof receivedVerifier).toBe('string');
      expect(receivedVerifier?.length).toBe(43);

      const calledAuthUrl = openAuthSpy.mock.calls[0]?.[0] ?? '';
      const challengeMatch = /code_challenge=([^&]+)/.exec(calledAuthUrl);
      const passedChallenge = challengeMatch?.[1];

      const expectedChallenge = crypto
        .createHash('sha256')
        .update(receivedVerifier as string)
        .digest('base64url');
      expect(passedChallenge).toBe(expectedChallenge);

      const tokens = await readTokens();
      expect(tokens?.accessToken).toBe('access-token-123');
      expect(tokens?.refreshToken).toBe('refresh-token-456');
      expect(getSession()?.staffName).toBe('พนักงานกานต์');
    });

    it('AC-3: user cancels browser (CANCEL) → returns to default with no error', async () => {
      jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: WebBrowser.WebBrowserResultType.CANCEL,
      });

      await renderWithProviders(<LoginScreen />);
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeTruthy();
      });

      expect(screen.queryByText('เข้าสู่ระบบไม่สำเร็จ')).toBeNull();
      expect(screen.queryByText('บัญชี LINE นี้ยังไม่ได้ลงทะเบียน')).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('AC-3: user dismisses browser (DISMISS) → returns to default with no error', async () => {
      jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: WebBrowser.WebBrowserResultType.DISMISS,
      });

      await renderWithProviders(<LoginScreen />);
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeTruthy();
      });

      expect(screen.queryByText('เข้าสู่ระบบไม่สำเร็จ')).toBeNull();
      expect(screen.queryByText('บัญชี LINE นี้ยังไม่ได้ลงทะเบียน')).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('AC-4: error=not_registered → renders login·4 copy and resets on "กลับไปหน้าเข้าสู่ระบบ"', async () => {
      jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: 'success',
        url: 'barapp://auth?error=not_registered',
      });

      await renderWithProviders(<LoginScreen />);
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('บัญชี LINE นี้ยังไม่ได้ลงทะเบียน')).toBeTruthy();
        expect(
          screen.getByText(
            'ส่งคำขอเข้าใช้งานถึงเจ้าของร้านแล้ว เข้าสู่ระบบอีกครั้งเมื่อได้รับอนุมัติ',
          ),
        ).toBeTruthy();
        expect(screen.getByText('กลับไปหน้าเข้าสู่ระบบ')).toBeTruthy();
        expect(screen.getByText('ติดต่อเจ้าของร้านหากรอนาน')).toBeTruthy();
      });

      const backButton = screen.getByText('กลับไปหน้าเข้าสู่ระบบ');
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeTruthy();
        expect(screen.getByText('เฉพาะพนักงาน The Loft Bar')).toBeTruthy();
      });
      expect(screen.queryByText('บัญชี LINE นี้ยังไม่ได้ลงทะเบียน')).toBeNull();
    });

    it('AC-4: error=login_failed → renders login·3 copy with "ลองอีกครั้ง"', async () => {
      jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: 'success',
        url: 'barapp://auth?error=login_failed',
      });

      await renderWithProviders(<LoginScreen />);
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ')).toBeTruthy();
        expect(
          screen.getByText('ลองอีกครั้ง หากยังไม่ได้ ให้ตรวจว่าเปิดแอป LINE ในเครื่องนี้แล้ว'),
        ).toBeTruthy();
        expect(screen.getByText('ลองอีกครั้ง')).toBeTruthy();
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('AC-4: token exchange failure (exchangeCode rejects) → renders login·3 copy with "ลองอีกครั้ง"', async () => {
      jest.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: 'success',
        url: 'barapp://auth?code=mock-auth-code',
      });
      jest.spyOn(authApi, 'exchangeCode').mockRejectedValueOnce(
        new Error('Network error during token exchange'),
      );

      await renderWithProviders(<LoginScreen />);
      const loginButton = screen.getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ')).toBeTruthy();
        expect(
          screen.getByText('ลองอีกครั้ง หากยังไม่ได้ ให้ตรวจว่าเปิดแอป LINE ในเครื่องนี้แล้ว'),
        ).toBeTruthy();
        expect(screen.getByText('ลองอีกครั้ง')).toBeTruthy();
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
