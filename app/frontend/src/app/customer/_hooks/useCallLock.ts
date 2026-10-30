"use client";

import { useEffect, useState } from "react";

/** A countdown lock: `lock(seconds)` starts it, `remaining` ticks down each second until it reaches 0. */
export function useCallLock(): { remaining: number; lock: (seconds: number) => void } {
  const [until, setUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (until === 0) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setUntil(0);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return { remaining, lock: (seconds) => setUntil(Date.now() + seconds * 1000) };
}
