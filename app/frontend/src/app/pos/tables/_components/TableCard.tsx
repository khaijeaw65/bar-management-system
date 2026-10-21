"use client";

import { Chip } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { formatTHB } from "@/lib/utils/format";
import { formatElapsed } from "./table-time";

function guestOf(seat: TableSummary): string {
  return seat.currentVisit?.guestLabel || "—";
}

export function TableCard({
  seat,
  now,
  selected,
  onPress,
}: Readonly<{
  seat: TableSummary;
  now: number | null;
  selected: boolean;
  onPress: () => void;
}>) {
  const visit = seat.currentVisit;
  const paying = visit?.paymentPending === true;
  const open = visit !== null && !paying && visit.itemCount === 0;
  const elapsed = visit && now !== null ? formatElapsed(visit.openedAt, now) : "--:--";

  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full flex-col items-start gap-1 rounded-card border border-line p-3 text-left shadow-(--shadow-card)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        visit ? "bg-surface-card text-text-body" : "bg-bg-sunken text-text-faint",
        selected && "ring-2 ring-line-accent",
      )}
    >
      <span className="text-subhead">{seat.label}</span>
      {open ? (
        <>
          <span>เปิดแล้ว</span>
          <span className="text-small text-text-muted">รอออเดอร์</span>
          <span className="max-w-full truncate text-small">{guestOf(seat)}</span>
        </>
      ) : null}
      {visit && !open ? (
        <>
          <span className="max-w-full truncate text-small">{guestOf(seat)}</span>
          <span className="text-small text-text-muted">
            {visit.itemCount} รายการ · {elapsed}
          </span>
          <span className="text-price text-text-accent tabular-nums">{formatTHB(visit.total)}</span>
          {paying ? (
            <Chip size="sm" color="warning" variant="soft">
              รอชำระ
            </Chip>
          ) : null}
        </>
      ) : null}
    </button>
  );
}
