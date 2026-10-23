import type { ReportItem } from "@bar/contracts";
import { Card } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";
import { toSatang } from "@/lib/utils/money";

type Metric = "revenue" | "quantity";

function size(item: ReportItem, metric: Metric): number {
  return metric === "revenue" ? toSatang(item.revenue) : item.quantity;
}

export function ItemsList({
  title,
  note,
  items,
  metric,
}: Readonly<{ title: string; note: string; items: ReportItem[]; metric: Metric }>) {
  const max = Math.max(0, ...items.map((item) => size(item, metric)));

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-heading">{title}</Card.Title>
        <Card.Description>{note}</Card.Description>
      </Card.Header>
      <Card.Content>
        {items.length === 0 ? (
          <p className="text-small text-text-muted">ยังไม่มีข้อมูลในช่วงนี้</p>
        ) : (
          <ol aria-label={title} className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.menuItemId} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="text-small text-text-muted tabular-nums">ขาย {item.quantity}</span>
                  <span className="w-28 text-right tabular-nums">{formatTHB(item.revenue)}</span>
                </div>
                <svg aria-hidden className="h-1.5 w-full" preserveAspectRatio="none">
                  <rect width={`${max === 0 ? 0 : (size(item, metric) / max) * 100}%`} height="100%" rx="3" className="fill-chart-1" />
                </svg>
              </li>
            ))}
          </ol>
        )}
      </Card.Content>
    </Card>
  );
}
