"use client";

import { LoadError } from "@/components/ui/LoadError";
import { useTodayReport } from "../_hooks/useTodayReport";
import { HourlyChart } from "./HourlyChart";
import { LiveStatus } from "./LiveStatus";
import { OpenSeatsList } from "./OpenSeatsList";
import { ReportSkeleton } from "./ReportStates";
import { TodayTiles } from "./TodayTiles";

export function Today() {
  const { today, stale } = useTodayReport();

  if (today.data === undefined) {
    if (today.isError) return <LoadError title="โหลดรายงานไม่สำเร็จ" onRetry={() => void today.refetch()} />;
    return <ReportSkeleton />;
  }

  const report = today.data;
  return (
    <div className="flex flex-col gap-4">
      <LiveStatus generatedAt={report.generatedAt} stale={stale} />
      <TodayTiles report={report} />
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <HourlyChart hourly={report.hourly} generatedAt={report.generatedAt} />
        </div>
        <OpenSeatsList seats={report.openSeats} now={report.generatedAt} />
      </div>
    </div>
  );
}
