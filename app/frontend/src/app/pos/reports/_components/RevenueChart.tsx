"use client";

import type { ReportDay } from "@bar/contracts";
import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTHB } from "@/lib/utils/format";
import { cmpMoney, sumMoney } from "@/lib/utils/money";
import { formatShortDate } from "../period";
import { DailyTable } from "./DailyTable";

interface Point {
  label: string;
  value: number;
  revenue: string;
}

const AXIS_TICK = { fill: "var(--text-faint)", fontSize: 12 };

function summaryLabel(days: ReportDay[]): string {
  const best = days.reduce((max, day) => (cmpMoney(day.revenue, max.revenue) > 0 ? day : max), days[0]);
  const total = formatTHB(sumMoney(days.map((day) => day.revenue)));
  const peak = best ? `สูงสุด ${formatShortDate(best.date)} ${formatTHB(best.revenue)}` : "";
  return `ยอดขายรายวัน ${days.length} วัน รวม ${total} ${peak}`.trim();
}

function axisMoney(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);
}

function PointTooltip({ active, payload }: Readonly<{ active?: boolean; payload?: { payload: Point }[] }>) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-input border border-line bg-surface-overlay px-3 py-2 text-small shadow-raised">
      <span className="text-text-muted">{point.label}</span>{" "}
      <span className="text-body-strong tabular-nums">{formatTHB(point.revenue)}</span>
    </div>
  );
}

export function RevenueChart({ days }: Readonly<{ days: ReportDay[] }>) {
  const [asTable, setAsTable] = useState(false);
  // Numbers only position the line; every label shows the server's money string.
  const points: Point[] = days.map((day) => ({ label: formatShortDate(day.date), value: Number(day.revenue), revenue: day.revenue }));

  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between">
        <Card.Title className="text-heading">ยอดขายรายวัน</Card.Title>
        <Button size="sm" variant="ghost" onPress={() => setAsTable((value) => !value)}>
          {asTable ? "ดูเป็นกราฟ" : "ดูเป็นตาราง"}
        </Button>
      </Card.Header>
      <Card.Content>
        {asTable ? (
          <DailyTable days={days} />
        ) : (
          <div role="img" aria-label={summaryLabel(days)} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line-hairline)" />
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={48} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickCount={4} width={40} tickFormatter={axisMoney} />
                <Tooltip content={<PointTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
                <Line type="linear" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--surface-card)", strokeWidth: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
