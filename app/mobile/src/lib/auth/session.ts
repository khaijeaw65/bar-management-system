import { useEffect, useState } from 'react';

export interface StaffSession {
  staffName: string;
  role: string;
}

let currentSession: StaffSession | null = null;
let mockSignInShouldFail = false;
let mockSignInDelayMs = 500;
const listeners = new Set<(session: StaffSession | null) => void>();

export function setMockSignInShouldFail(shouldFail: boolean): void {
  mockSignInShouldFail = shouldFail;
}

export function setMockSignInDelayMs(ms: number): void {
  mockSignInDelayMs = ms;
}

export function getSession(): StaffSession | null {
  return currentSession;
}

export function resetSession(): void {
  currentSession = null;
  mockSignInShouldFail = false;
  mockSignInDelayMs = 500;
  listeners.forEach((listener) => listener(null));
}

export async function signIn(opts?: { delayMs?: number }): Promise<StaffSession> {
  const delay = opts?.delayMs ?? mockSignInDelayMs;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (mockSignInShouldFail) {
    throw new Error('เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง');
  }

  const session: StaffSession = {
    staffName: 'บีม',
    role: 'bartender',
  };
  currentSession = session;
  listeners.forEach((listener) => listener(currentSession));
  return session;
}

export async function signOut(): Promise<void> {
  currentSession = null;
  listeners.forEach((listener) => listener(null));
}

export function useSession() {
  const [session, setSession] = useState<StaffSession | null>(currentSession);

  useEffect(() => {
    const listener = (newSession: StaffSession | null) => {
      setSession(newSession);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session,
    isLoading: false,
    signIn,
    signOut,
  };
}
