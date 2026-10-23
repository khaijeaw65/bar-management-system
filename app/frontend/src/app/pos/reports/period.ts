import { REPORT_MAX_PERIOD_DAYS } from "@bar/contracts";
import type { ReportPeriod } from "@/lib/api/reports";

export type PeriodPreset = "today" | "7" | "30" | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "วันนี้",
  "7": "7 วัน",
  "30": "30 วัน",
  custom: "กำหนดเอง",
};

const DAY_MS = 24 * 3600 * 1000;
// Asia/Bangkok has no DST, so the business day is a fixed shift — same rule as the backend's businessDate().
const BANGKOK_OFFSET_MS = 7 * 3600 * 1000;

export function businessToday(now: Date, cutoff: string): string {
  const [hours = 0, minutes = 0] = cutoff.split(":").map(Number);
  const shifted = now.getTime() + BANGKOK_OFFSET_MS - (hours * 60 + minutes) * 60_000;
  return new Date(shifted).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function periodDays({ from, to }: ReportPeriod): number {
  return (Date.parse(to) - Date.parse(from)) / DAY_MS + 1;
}

export function isValidPeriod(range: ReportPeriod): boolean {
  const days = periodDays(range);
  return days >= 1 && days <= REPORT_MAX_PERIOD_DAYS;
}

export function presetPeriod(preset: Exclude<PeriodPreset, "custom">, today: string): ReportPeriod {
  const days = preset === "today" ? 1 : Number(preset);
  return { from: addDays(today, 1 - days), to: today };
}

// Whole percent change vs the previous period; null when there is nothing to compare with (CD-05 §9).
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

const shortDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });

export function formatShortDate(date: string): string {
  return shortDate.format(new Date(`${date}T00:00:00Z`));
}
