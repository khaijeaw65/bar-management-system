import { useEffect, useState } from "react";

export function formatElapsed(openedAt: string, now: number): string {
  const elapsed = Math.max(0, now - Date.parse(openedAt));
  const totalMinutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function formatThaiTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return `${formatted} น.`;
}

export function useMinuteClock(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return now;
}
