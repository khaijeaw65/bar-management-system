import { useEffect, useState } from 'react';

export interface StaffSession {
  staffName: string;
  role: string;
}

let currentSession: StaffSession | null = null;
let mockSignInShouldFail = false;
const listeners = new Set<(session: StaffSession | null) => void>();

export function setMockSignInShouldFail(shouldFail: boolean): void {
  mockSignInShouldFail = shouldFail;
}

export function getSession(): StaffSession | null {
  return currentSession;
}

export function resetSession(): void {
  currentSession = null;
  mockSignInShouldFail = false;
  listeners.forEach((listener) => listener(null));
}

export async function signIn(opts?: { delayMs?: number }): Promise<StaffSession> {
  const defaultDelay = process.env.NODE_ENV === 'test' ? 0 : 500;
  const delay = opts?.delayMs ?? defaultDelay;
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
  const [isLoading] = useState(false);

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
    isLoading,
    signIn,
    signOut,
  };
}
