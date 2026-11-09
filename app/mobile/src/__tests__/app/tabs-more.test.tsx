import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import MoreScreen from '../../app/(tabs)/more';
import { signIn, getSession, resetSession } from '../../lib/auth/session';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

async function renderWithProviders(ui: React.ReactElement) {
  return await render(<HeroUINativeProvider>{ui}</HeroUINativeProvider>);
}

describe('MoreScreen (AC-2)', () => {
  beforeEach(async () => {
    resetSession();
    mockReplace.mockClear();
    await signIn({ delayMs: 0 });
  });

  afterEach(() => {
    cleanup();
    resetSession();
  });

  it('renders staff name from session', async () => {
    await renderWithProviders(<MoreScreen />);
    expect(screen.getByText('อื่นๆ')).toBeTruthy();
    expect(screen.getByText('พนักงาน')).toBeTruthy();
    expect(screen.getByText('บีม')).toBeTruthy();
    expect(screen.getByText('ออกจากระบบ')).toBeTruthy();
  });

  it('signs out and navigates back to login replacing the stack (AC-2)', async () => {
    await renderWithProviders(<MoreScreen />);
    const logoutButton = screen.getByText('ออกจากระบบ');

    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
    expect(getSession()).toBeNull();
  });
});
