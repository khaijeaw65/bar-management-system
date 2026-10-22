"use client";

import { useEffect, useState } from "react";

export function useQrClock(expiresAt: string | null): { clock: string; minute: number } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = expiresAt ? Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000)) : 0;
  const minute = Math.floor(left / 60);
  const clock = `${String(minute).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  return { clock, minute };
}
