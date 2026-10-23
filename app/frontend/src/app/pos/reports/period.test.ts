import { expect, test } from "vitest";
import { visibleHours } from "./hourly";
import { businessToday, deltaPercent, isValidPeriod, presetPeriod } from "./period";

test("business day follows the venue cut-off in Bangkok time", () => {
  expect(businessToday(new Date("2026-10-22T22:59:00Z"), "06:00")).toBe("2026-10-22"); // 05:59 on 23 Oct
  expect(businessToday(new Date("2026-10-22T23:00:00Z"), "06:00")).toBe("2026-10-23"); // 06:00
  expect(businessToday(new Date("2026-10-22T19:30:00Z"), "02:30")).toBe("2026-10-23"); // 02:30
});

test("presets end today; periods are 1–92 days", () => {
  expect(presetPeriod("today", "2026-10-22")).toEqual({ from: "2026-10-22", to: "2026-10-22" });
  expect(presetPeriod("30", "2026-03-01")).toEqual({ from: "2026-01-31", to: "2026-03-01" });
  expect(isValidPeriod({ from: "2026-07-23", to: "2026-10-22" })).toBe(true);
  expect(isValidPeriod({ from: "2026-07-22", to: "2026-10-22" })).toBe(false);
  expect(isValidPeriod({ from: "2026-10-23", to: "2026-10-22" })).toBe(false);
});

test("delta is a whole percent and absent without a previous period", () => {
  expect(deltaPercent(112, 100)).toBe(12);
  expect(deltaPercent(92, 100)).toBe(-8);
  expect(deltaPercent(50, 0)).toBeNull();
});

const hours = (sales: Record<number, string>) =>
  Array.from({ length: 24 }, (_, index) => {
    const hour = (6 + index) % 24;
    return { hour, revenue: sales[hour] ?? "0.00" };
  });

test("hourly window: from 18:00 (or the first sale) to now + 2, later hours dashed", () => {
  const evening = visibleHours(hours({ 18: "100.00", 21: "50.00" }), "2026-10-22T14:14:00Z");
  expect(evening.map((bar) => bar.hour)).toEqual([18, 19, 20, 21, 22, 23]);
  expect(evening.filter((bar) => bar.future).map((bar) => bar.hour)).toEqual([22, 23]);

  const early = visibleHours(hours({ 16: "80.00" }), "2026-10-22T10:05:00Z");
  expect(early.map((bar) => bar.hour)).toEqual([16, 17, 18, 19]);

  const lateNight = visibleHours(hours({ 23: "80.00" }), "2026-10-22T21:30:00Z");
  expect(lateNight.at(0)?.hour).toBe(18);
  expect(lateNight.at(-1)?.hour).toBe(5); // 04:30 + 2 stops at the last bucket before the cut-off
});
