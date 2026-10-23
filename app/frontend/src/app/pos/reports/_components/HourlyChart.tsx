"use client";

import type { ReportToday } from "@bar/contracts";
import { Card } from "@heroui/react";
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, type BarShapeProps } from "recharts";
import { formatTHB } from "@/lib/utils/format";
import { sumMoney } from "@/lib/utils/money";
import { visibleHours, type HourBar } from "../hourly";
import { ReportEmpty } from "./ReportStates";

const whole = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

// Filled bars for hours so far; a dashed outline for hours still to come (CD-05 §7).
function HourShape({ x = 0, y = 0, width = 0, height = 0, background, payload }: BarShapeProps) {
  if ((payload as HourBar | undefined)?.future) {
    const top = background?.y ?? y;
    const full = background?.height ?? height;
    return <rect x={x} y={top} width={width} height={full} rx={4} fill="none" stroke="var(--line-strong)" strokeDasharray="4 4" />;
  }
  if (height <= 0) return <g />;
  return <path d={roundedTop(x, y, width, height, 4)} fill="var(--chart-1)" />;
}

function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + w - radius} Q${x + w},${y} ${x + w},${y + radius} V${y + h} Z`;
}

function barText(bar: HourBar): string {
  return `${bar.label} ${formatTHB(bar.revenue)}`;
}

export function HourlyChart({ hourly, generatedAt }: Readonly<{ hourly: ReportToday["hourly"]; generatedAt: string }>) {
  const bars = visibleHours(hourly, generatedAt);
  const total = sumMoney(hourly.map((bucket) => bucket.revenue));
  const sold = bars.filter((bar) => !bar.future && bar.revenue !== "0.00");

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="text-heading">ยอดขายรายชั่วโมง</Card.Title>
        <Card.Description>บิลที่ชำระแล้ว · ช่องเส้นประ = ยังไม่ถึง</Card.Description>
      </Card.Header>
      <Card.Content>
        {total === "0.00" ? (
          <ReportEmpty />
        ) : (
          <div
            role="img"
            aria-label={`ยอดขายรายชั่วโมง รวม ${formatTHB(total)}: ${sold.map(barText).join(", ")}`}
            className="h-56"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 20, right: 0, bottom: 0, left: 0 }} barCategoryGap={6}>
                <XAxis dataKey="label" tick={{ fill: "var(--text-faint)", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Bar dataKey="value" shape={HourShape} background={{ fill: "none" }} isAnimationActive={false}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="var(--text-muted)"
                    fontSize={12}
                    formatter={(value: unknown) => (typeof value === "number" && value > 0 ? whole.format(value) : "")}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
