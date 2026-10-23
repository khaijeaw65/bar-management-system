import {
  ReportDailySchema,
  ReportItemsSchema,
  ReportSummarySchema,
  ReportTodaySchema,
  type ReportItemsSort,
} from "@bar/contracts";
import { apiGet } from "./client";

export interface ReportPeriod {
  from: string;
  to: string;
}

function period({ from, to }: ReportPeriod): string {
  return new URLSearchParams({ from, to }).toString();
}

export function getReportSummary(range: ReportPeriod) {
  return apiGet(`/reports/summary?${period(range)}`, ReportSummarySchema);
}

export function getReportDaily(range: ReportPeriod) {
  return apiGet(`/reports/daily?${period(range)}`, ReportDailySchema);
}

export function getReportItems(range: ReportPeriod, sort: ReportItemsSort) {
  return apiGet(`/reports/items?${period(range)}&sort=${sort}&limit=5`, ReportItemsSchema);
}

export function getReportToday() {
  return apiGet("/reports/today", ReportTodaySchema);
}
