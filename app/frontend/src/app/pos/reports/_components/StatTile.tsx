import { Card } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function StatTile({
  label,
  value,
  delta,
  children,
}: Readonly<{ label: string; value?: string; delta?: number | null; children?: ReactNode }>) {
  return (
    <Card>
      <Card.Content className="flex flex-col gap-1">
        <span className="text-small text-text-muted">{label}</span>
        {value ? <span className="text-title tabular-nums">{value}</span> : null}
        {delta === undefined || delta === null ? null : <Delta value={delta} />}
        {children}
      </Card.Content>
    </Card>
  );
}

function Delta({ value }: Readonly<{ value: number }>) {
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "text-small tabular-nums",
        value > 0 && "text-success-fg",
        value < 0 && "text-text-danger",
        value === 0 && "text-text-muted",
      )}
    >
      {`${sign}${value}% จากช่วงก่อน`}
    </span>
  );
}
