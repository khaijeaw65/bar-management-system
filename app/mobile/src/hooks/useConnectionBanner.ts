import { useEffect, useState } from 'react';
import { isStaffSocketConnected, onSocketStatus } from '../lib/realtime/socket';
import { realtimeEnabled } from './useStaffRealtime';

/** Banner queue·6 shows only after the socket has been down for more than 3 s (brief §7). */
export const DISCONNECT_BANNER_MS = 3000;

export function useConnectionBanner(): boolean {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!realtimeEnabled()) return undefined;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const update = (connected: boolean) => {
      if (connected) {
        if (timer) clearTimeout(timer);
        timer = null;
        setShowBanner(false);
        return;
      }
      timer ??= setTimeout(() => setShowBanner(true), DISCONNECT_BANNER_MS);
    };
    update(isStaffSocketConnected());
    const unsubscribe = onSocketStatus(update);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return showBanner;
}
