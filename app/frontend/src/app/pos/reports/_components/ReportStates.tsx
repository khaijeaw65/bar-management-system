import { Skeleton } from "@heroui/react";
import { ChartColumn } from "lucide-react";

export function ReportSkeleton({ tiles = 4 }: Readonly<{ tiles?: number }>) {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดรายงาน" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: tiles }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-card" />
    </div>
  );
}

export function ReportEmpty({ text = "ยังไม่มียอดขายในช่วงนี้" }: Readonly<{ text?: string }>) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-line-hairline bg-surface-card py-12 text-text-muted">
      <ChartColumn size={32} strokeWidth={1.5} aria-hidden />
      <p className="text-body-strong">{text}</p>
    </div>
  );
}
