import type { ReportToday } from "@bar/contracts";
import { Card } from "@heroui/react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatTHB } from "@/lib/utils/format";
import { StatTile } from "./StatTile";

function LinkTile({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Link
      href="/pos/orders"
      className="rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <Card className="h-full hover:bg-surface-hover">
        <Card.Content className="flex flex-col gap-1">
          <span className="flex items-center justify-between text-small text-text-muted">
            {label}
            <ChevronRight size={16} aria-hidden />
          </span>
          <span className="text-title tabular-nums">{value}</span>
        </Card.Content>
      </Card>
    </Link>
  );
}

export function TodayTiles({ report }: Readonly<{ report: ReportToday }>) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile label="ยอดวันนี้" value={formatTHB(report.revenue)} />
      <StatTile label="บิลที่ปิดแล้ว" value={report.bills.toLocaleString("th-TH")} />
      {/* pending + accepted + ready tickets — the board the tile opens (BRIEF-036 audit F2) */}
      <LinkTile label="ออเดอร์ค้าง" value={report.pendingTickets} />
      <LinkTile label="มีปัญหา" value={report.escalatedIssues} />
    </div>
  );
}
