import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import LoginScreen from '../../app/login';
import { resetSession, setMockSignInShouldFail, getSession } from '../../lib/auth/session';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

async function renderWithProviders(ui: React.ReactElement) {
  return await render(<HeroUINativeProvider>{ui}</HeroUINativeProvider>);
}

describe('LoginScreen (AC-1)', () => {
  beforeEach(() => {
    resetSession();
    mockReplace.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders login screen elements when no session exists', async () => {
    await renderWithProviders(<LoginScreen />);
    expect(screen.getByText('The Loft Bar')).toBeTruthy();
    expect(screen.getByText('ระบบจัดการบาร์')).toBeTruthy();
    expect(screen.getByText('เข้าสู่ระบบด้วย LINE')).toBeTruthy();
    expect(screen.getByText('เฉพาะพนักงาน The Loft Bar')).toBeTruthy();
  });

  it('signs in with mock and lands on order queue (AC-1)', async () => {
    await renderWithProviders(<LoginScreen />);
    const loginButton = screen.getByText('เข้าสู่ระบบด้วย LINE');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/orders');
    });
    expect(getSession()?.staffName).toBe('บีม');
  });

  it('shows error Alert when login fails', async () => {
    setMockSignInShouldFail(true);
    await renderWithProviders(<LoginScreen />);
    const loginButton = screen.getByText('เข้าสู่ระบบด้วย LINE');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง')).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
