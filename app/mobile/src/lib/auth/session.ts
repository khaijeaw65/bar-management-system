import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { createPkcePair } from './pkce';
import { readTokens, saveTokens, clearTokens } from './token-storage';
import { exchangeCode, getMe, logout } from '../api/auth';
import { apiClient, onAuthExpired } from '../api/client';

export interface StaffSession {
  staffName: string;
  role: string;
  id?: string;
  avatarUrl?: string | null;
}

export class AuthCancelledError extends Error {
  public constructor(message = 'User cancelled authentication') {
    super(message);
    this.name = 'AuthCancelledError';
    Object.setPrototypeOf(this, AuthCancelledError.prototype);
  }
}

export class AuthNotRegisteredError extends Error {
  public constructor(message = 'Account not registered') {
    super(message);
    this.name = 'AuthNotRegisteredError';
    Object.setPrototypeOf(this, AuthNotRegisteredError.prototype);
  }
}

export class AuthFailedError extends Error {
  public constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthFailedError';
    Object.setPrototypeOf(this, AuthFailedError.prototype);
  }
}

let currentSession: StaffSession | null = null;
let isInitialized = false;
let initPromise: Promise<StaffSession | null> | null = null;
let mockSignInShouldFail = false;
let mockSignInDelayMs = 500;
let sessionExpiredReason: string | null = null;

const listeners = new Set<(session: StaffSession | null) => void>();

function notifyListeners(session: StaffSession | null): void {
  listeners.forEach((listener) => {
    listener(session);
  });
}

onAuthExpired(() => {
  currentSession = null;
  sessionExpiredReason = 'signed_out';
  notifyListeners(null);
});

export function setMockSignInShouldFail(shouldFail: boolean): void {
  mockSignInShouldFail = shouldFail;
}

export function setMockSignInDelayMs(ms: number): void {
  mockSignInDelayMs = ms;
}

export function getSession(): StaffSession | null {
  return currentSession;
}

export function getSessionExpiredReason(): string | null {
  return sessionExpiredReason;
}

export function clearSessionExpiredReason(): void {
  sessionExpiredReason = null;
}

export function setSessionInitialized(initialized: boolean): void {
  isInitialized = initialized;
  initPromise = null;
}

export function resetSession(): void {
  currentSession = null;
  isInitialized = true;
  initPromise = null;
  mockSignInShouldFail = false;
  mockSignInDelayMs = 500;
  sessionExpiredReason = null;
  notifyListeners(null);
}

export async function initSession(): Promise<StaffSession | null> {
  if (isInitialized) {
    return currentSession;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (process.env.EXPO_PUBLIC_USE_MOCKS === '1') {
        isInitialized = true;
        return currentSession;
      }

      const tokens = await readTokens();
      if (!tokens?.accessToken && !tokens?.refreshToken) {
        currentSession = null;
        isInitialized = true;
        return null;
      }

      const me = await getMe();
      const session: StaffSession = {
        staffName: me.displayName,
        role: 'staff',
        id: me.id,
        avatarUrl: me.avatarUrl,
      };
      currentSession = session;
      isInitialized = true;
      notifyListeners(currentSession);
      return session;
    } catch {
      await clearTokens();
      currentSession = null;
      isInitialized = true;
      notifyListeners(null);
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

export async function signIn(opts?: { delayMs?: number }): Promise<StaffSession> {
  if (process.env.EXPO_PUBLIC_USE_MOCKS === '1') {
    const delay = opts?.delayMs ?? mockSignInDelayMs;
    if (delay > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }

    if (mockSignInShouldFail) {
      throw new AuthFailedError('เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง');
    }

    const session: StaffSession = {
      staffName: 'บีม',
      role: 'bartender',
    };
    currentSession = session;
    isInitialized = true;
    notifyListeners(currentSession);
    return session;
  }

  const { verifier, challenge } = await createPkcePair();
  const apiBase = apiClient.defaults.baseURL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const authUrl = `${apiBase}/auth/line/login?client=mobile&code_challenge=${challenge}&code_challenge_method=S256`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, 'barapp://auth');

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new AuthCancelledError('User cancelled authentication');
  }

  if (result.type !== 'success' || !result.url) {
    throw new AuthFailedError('Authentication failed');
  }

  const parsed = Linking.parse(result.url);
  const errorParam = parsed.queryParams?.error;
  if (errorParam === 'not_registered') {
    throw new AuthNotRegisteredError('Account not registered');
  }
  if (errorParam) {
    const msg = typeof errorParam === 'string' ? errorParam : 'Login failed';
    throw new AuthFailedError(msg);
  }

  const codeParam = parsed.queryParams?.code;
  if (!codeParam || typeof codeParam !== 'string') {
    throw new AuthFailedError('No authorization code returned');
  }

  const tokenResponse = await exchangeCode(codeParam, verifier);
  await saveTokens({
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
  });

  const me = await getMe();
  const session: StaffSession = {
    staffName: me.displayName,
    role: 'staff',
    id: me.id,
    avatarUrl: me.avatarUrl,
  };
  currentSession = session;
  isInitialized = true;
  notifyListeners(currentSession);
  return session;
}

export async function signOut(): Promise<void> {
  try {
    const tokens = await readTokens();
    if (tokens?.refreshToken) {
      await logout(tokens.refreshToken);
    }
  } catch {
    // Ignore network error; local tokens must still be cleared
  } finally {
    await clearTokens();
    currentSession = null;
    notifyListeners(null);
  }
}

export function useSession() {
  const [session, setSession] = useState<StaffSession | null>(currentSession);
  const [isLoading, setIsLoading] = useState<boolean>(!isInitialized);

  useEffect(() => {
    const listener = (newSession: StaffSession | null) => {
      setSession(newSession);
    };
    listeners.add(listener);

    if (!isInitialized) {
      initSession().finally(() => {
        setIsLoading(false);
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session,
    isLoading,
    signIn,
    signOut,
  };
}
