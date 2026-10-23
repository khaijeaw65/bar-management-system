"use client";

import { LoadError } from "@/components/ui/LoadError";
import { useOverviewReports, useReportPeriod } from "../_hooks/useOverviewReports";
import { ComingSoonCard } from "./ComingSoonCard";
import { ItemsList } from "./ItemsList";
import { PeriodSelect } from "./PeriodSelect";
import { ReportEmpty, ReportSkeleton } from "./ReportStates";
import { RevenueChart } from "./RevenueChart";
import { SummaryTiles } from "./SummaryTiles";

export function Overview() {
  const period = useReportPeriod();
  const reports = useOverviewReports(period.range);
  const failed = period.venue.isError || reports.isError;

  function body() {
    if (failed) {
      return (
        <LoadError
          title="โหลดรายงานไม่สำเร็จ"
          onRetry={() => (period.venue.isError ? void period.venue.refetch() : reports.retry())}
        />
      );
    }
    const { summary, daily, top, bottom } = reports;
    if (!summary || !daily || !top || !bottom) return <ReportSkeleton />;
    if (summary.bills === 0 && summary.revenue === "0.00") return <ReportEmpty />;
    return (
      <>
        <SummaryTiles summary={summary} />
        <RevenueChart days={daily} />
        <div className="grid grid-cols-2 gap-4">
          <ItemsList title="ขายดี 5 อันดับ" note="ตามยอดขาย" items={top} metric="revenue" />
          <ItemsList title="ขายน้อย 5 อันดับ" note="ตามจำนวน · พิจารณาเอาออก" items={bottom} metric="quantity" />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {period.today && period.range ? (
        <PeriodSelect
          preset={period.preset}
          range={period.range}
          today={period.today}
          onPreset={period.choose}
          onRange={period.setCustom}
        />
      ) : null}
      {body()}
      <ComingSoonCard />
    </div>
  );
}
