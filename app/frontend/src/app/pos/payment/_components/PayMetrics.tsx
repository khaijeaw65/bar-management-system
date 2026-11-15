"use client";

import { Card } from "@heroui/react";
import type { TodayPaymentsSummary } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface PayMetricsProps {
  summary?: TodayPaymentsSummary;
  unpaidCount: number;
}

export function PayMetrics({ summary, unpaidCount }: Readonly<PayMetricsProps>) {
  const totalRevenue = summary ? formatTHB(summary.totalRevenue) : "฿0.00";
  const promptpayTotal = summary ? formatTHB(summary.promptpayTotal) : "฿0.00";
  const cashTotal = summary ? formatTHB(summary.cashTotal) : "฿0.00";
  const promptpayCount = summary ? summary.completedCount : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <Card.Content className="flex flex-col gap-1 p-4">
          <span className="text-small text-text-muted">ยอดรวมชำระแล้ว</span>
          <span className="text-title font-bold text-text-accent tabular-nums">{totalRevenue}</span>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="flex flex-col gap-1 p-4">
          <span className="text-small text-text-muted">PromptPay</span>
          <span className="text-title font-bold text-text-body tabular-nums">{promptpayTotal}</span>
          <span className="text-micro text-text-faint">{promptpayCount} รายการ</span>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="flex flex-col gap-1 p-4">
          <span className="text-small text-text-muted">เงินสด</span>
          <span className="text-title font-bold text-text-body tabular-nums">{cashTotal}</span>
        </Card.Content>
      </Card>

      <Card className={cn(unpaidCount > 0 && "border-line-accent bg-accent-soft")}>
        <Card.Content className="flex flex-col gap-1 p-4">
          <span className="text-small text-text-muted">บิลรอชำระ</span>
          <span
            className={cn(
              "text-title font-bold tabular-nums",
              unpaidCount > 0 ? "text-text-accent" : "text-text-body",
            )}
          >
            {unpaidCount} โต๊ะ
          </span>
        </Card.Content>
      </Card>
    </div>
  );
}
