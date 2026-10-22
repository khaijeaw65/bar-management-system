import { clockSeconds } from '../../../common/time-label.js';
import { addDays, businessDayStart, daysBetweenInclusive } from '../../../common/business-date.js';
import type { DayTotal, HourRevenue, ReportWindow } from '../domain/report.types.js';
import type { BusinessPeriod } from './report-period.types.js';

const HOURS_PER_DAY = 24;

export function reportWindow(period: BusinessPeriod, cutoff: string): ReportWindow {
  return {
    from: period.from,
    to: period.to,
    start: businessDayStart(period.from, cutoff),
    end: businessDayStart(addDays(period.to, 1), cutoff),
    cutoff,
  };
}

/** Same length, ending the day before `from` (CD-05 §9). */
export function previousPeriod(period: BusinessPeriod): BusinessPeriod {
  const length = daysBetweenInclusive(period.from, period.to);
  return { from: addDays(period.from, -length), to: addDays(period.from, -1) };
}

/** Every business date in the period, ascending, zeros where nothing happened. */
export function fillDays(period: BusinessPeriod, totals: readonly DayTotal[]): DayTotal[] {
  const byDate = new Map(totals.map((day) => [day.date, day]));
  const length = daysBetweenInclusive(period.from, period.to);
  return Array.from({ length }, (_, index) => {
    const date = addDays(period.from, index);
    return byDate.get(date) ?? { date, revenue: '0.00', bills: 0 };
  });
}

/** 24 Bangkok clock hours, starting at the hour the business day opens. */
export function hourlyBuckets(cutoff: string, hours: readonly HourRevenue[]): HourRevenue[] {
  const byHour = new Map(hours.map((bucket) => [bucket.hour, bucket.revenue]));
  const firstHour = Math.floor(clockSeconds(cutoff) / 3600);
  return Array.from({ length: HOURS_PER_DAY }, (_, index) => {
    const hour = (firstHour + index) % HOURS_PER_DAY;
    return { hour, revenue: byHour.get(hour) ?? '0.00' };
  });
}
