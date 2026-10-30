"use client";

import { Chip } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { StaffCallRow } from "../../_components/StaffCallRow";
import { formatTHB } from "@/lib/utils/format";
import { formatElapsed } from "./table-time";

function guestOf(seat: TableSummary): string {
  return seat.currentVisit?.guestLabel || "—";
}

export function TableCard({
  seat,
  now,
  selected,
  pendingOrders,
  onPress,
  onAcknowledge,
}: Readonly<{
  seat: TableSummary;
  now: number | null;
  selected: boolean;
  pendingOrders: number;
  onPress: () => void;
  onAcknowledge: () => void;
}>) {
  const visit = seat.currentVisit;
  const paying = visit?.paymentPending === true;
  const open = visit !== null && !paying && visit.itemCount === 0;
  const elapsed = visit && now !== null ? formatElapsed(visit.openedAt, now) : "--:--";

  return (
    // The acknowledge Button is a sibling of the card button (no nested buttons), so its tap never opens the drawer.
    <div
      className={cn(
        "flex w-full flex-col rounded-card border border-line shadow-(--shadow-card)",
        visit ? "bg-surface-card text-text-body" : "bg-bg-sunken text-text-faint",
        selected && "ring-2 ring-line-accent",
      )}
    >
      <button
        type="button"
        onClick={onPress}
        aria-pressed={selected}
        className={cn(
          "flex min-h-11 w-full flex-col items-start gap-1 rounded-card p-3 text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
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
      {pendingOrders > 0 || seat.staffCall ? (
        <div className="flex flex-col items-start gap-2 px-3 pb-3">
          {pendingOrders > 0 ? (
            <Chip size="sm" color="accent" variant="soft">
              ออเดอร์ใหม่ {pendingOrders}
            </Chip>
          ) : null}
          {seat.staffCall ? (
            <StaffCallRow label={seat.label} call={seat.staffCall} now={now} onAcknowledge={onAcknowledge} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
