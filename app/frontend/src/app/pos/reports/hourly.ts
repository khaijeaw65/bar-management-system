import type { ReportToday } from "@bar/contracts";

export interface HourBar {
  label: string;
  hour: number;
  value: number;
  revenue: string;
  future: boolean;
}

const EVENING_START = 18;
const AHEAD_HOURS = 2;

export function bangkokHour(iso: string): number {
  return (new Date(iso).getUTCHours() + 7) % 24;
}

// Buckets start at the cut-off hour. Show from the first hour with sales (or 18:00, whichever is
// earlier) to two hours past now; hours after now are drawn as dashed placeholders.
export function visibleHours(hourly: ReportToday["hourly"], generatedAt: string): HourBar[] {
  const now = hourly.findIndex((bucket) => bucket.hour === bangkokHour(generatedAt));
  const evening = hourly.findIndex((bucket) => bucket.hour === EVENING_START);
  const firstSale = hourly.findIndex((bucket) => bucket.revenue !== "0.00");
  const starts = [evening, firstSale, now].filter((index) => index >= 0);
  const start = Math.min(...starts);
  const end = Math.min(hourly.length - 1, Math.max(now, start) + AHEAD_HOURS);

  return hourly.slice(start, end + 1).map((bucket, offset) => ({
    label: `${String(bucket.hour).padStart(2, "0")}:00`,
    hour: bucket.hour,
    value: Number(bucket.revenue),
    revenue: bucket.revenue,
    future: start + offset > now,
  }));
}
