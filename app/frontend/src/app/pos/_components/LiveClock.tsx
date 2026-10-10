"use client";

import { useEffect, useState } from "react";

function formatBangkok(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${formatted} น.`;
}

function msUntilNextMinute(date: Date): number {
  return (60 - date.getSeconds()) * 1000 - date.getMilliseconds();
}

export function LiveClock() {
  // Null until mount so server HTML and the first client render match.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = new Date();
      setNow(current);
      timer = setTimeout(tick, msUntilNextMinute(current));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <time className="text-[13px] font-semibold text-text-muted tabular-nums">
      {now ? formatBangkok(now) : "--:-- น."}
    </time>
  );
}
