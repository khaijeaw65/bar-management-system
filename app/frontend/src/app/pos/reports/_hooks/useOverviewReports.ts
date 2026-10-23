"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { VENUE_KEY } from "@/hooks/useVenueEvents";
import {
  getReportDaily,
  getReportItems,
  getReportSummary,
  type ReportPeriod,
} from "@/lib/api/reports";
import { getVenue } from "@/lib/api/venue";
import { businessToday, presetPeriod, type PeriodPreset } from "../period";

export function useReportPeriod() {
  const venue = useQuery({ queryKey: VENUE_KEY, queryFn: getVenue, staleTime: 60_000 });
  const [preset, setPreset] = useState<PeriodPreset>("30");
  const [custom, setCustom] = useState<ReportPeriod | null>(null);
  const today = venue.data ? businessToday(new Date(), venue.data.businessDayCutoff) : null;

  let range: ReportPeriod | null = null;
  if (today !== null) {
    range = preset === "custom" ? (custom ?? presetPeriod("30", today)) : presetPeriod(preset, today);
  }

  function choose(next: PeriodPreset) {
    // กำหนดเอง starts from the range on screen, so the picker opens on something sensible.
    if (next === "custom" && custom === null) setCustom(range);
    setPreset(next);
  }

  return { venue, today, preset, range, choose, setCustom };
}

function reportQuery<T>(kind: string, range: ReportPeriod | null, load: (range: ReportPeriod) => Promise<T>) {
  return {
    queryKey: ["reports", kind, range?.from, range?.to],
    queryFn: () => (range ? load(range) : Promise.reject(new Error("no period"))),
    enabled: range !== null,
  };
}

export function useOverviewReports(range: ReportPeriod | null) {
  const summary = useQuery(reportQuery("summary", range, getReportSummary));
  const daily = useQuery(reportQuery("daily", range, getReportDaily));
  const top = useQuery(reportQuery("top", range, (period) => getReportItems(period, "top")));
  const bottom = useQuery(reportQuery("bottom", range, (period) => getReportItems(period, "bottom")));
  const all = [summary, daily, top, bottom];

  return {
    summary: summary.data,
    daily: daily.data?.items,
    top: top.data?.items,
    bottom: bottom.data?.items,
    isPending: all.some((query) => query.isPending),
    isError: all.some((query) => query.isError),
    retry: () => all.filter((query) => query.isError).forEach((query) => void query.refetch()),
  };
}
