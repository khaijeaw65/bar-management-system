"use client";

import type { OrderLine, Ticket } from "@bar/contracts";
import { Button, Chip } from "@heroui/react";
import { cn } from "@/lib/utils/cn";
import { formatThaiTime } from "../../tables/_components/table-time";
import { actionOf, orderTag, stationLabel } from "../board";
import { issueReasonLabel } from "./issue-reason";

const VISIBLE_LINES = 4;

function Line({ line }: Readonly<{ line: OrderLine }>) {
  const cancelled = line.cancelledAt !== null;
  return (
    <li>
      <span className={cn("text-body-md", cancelled && "text-text-muted line-through")}>
        {line.quantity}× {line.name}
      </span>
      {line.cancellation?.system ? (
        <span className="block text-small text-text-muted">ยกเลิกอัตโนมัติ · ของหมด</span>
      ) : null}
    </li>
  );
}

export function TicketCard({
  ticket,
  kitchenOn,
  pending,
  fresh,
  onOpen,
  onAct,
}: Readonly<{
  ticket: Ticket;
  kitchenOn: boolean;
  pending: boolean;
  fresh: boolean;
  onOpen: () => void;
  onAct: (kind: "accept" | "ready" | "send") => void;
}>) {
  const tag = orderTag(ticket.orderNumber);
  const seat = ticket.seat.label;
  const action = actionOf(ticket, kitchenOn);
  const hidden = ticket.items.length - VISIBLE_LINES;

  return (
    <li>
      <article
        aria-label={`ออเดอร์ ${tag} ${seat}`}
        className={cn(
          "flex flex-col gap-3 rounded-card border border-line bg-surface-card p-3 shadow-(--shadow-card)",
          fresh && "ring-2 ring-line-accent",
        )}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label={`ดูรายละเอียด ${tag} ${seat}`}
          className="flex min-h-11 flex-col gap-2 rounded-btn text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-subhead">
              {tag} · {seat}
            </span>
            <span className="text-small text-text-muted">{formatThaiTime(ticket.createdAt)}</span>
          </span>
          {kitchenOn && ticket.station ? (
            <Chip size="sm" variant="soft">
              {stationLabel[ticket.station]}
            </Chip>
          ) : null}
          <ul className="flex flex-col gap-1">
            {ticket.items.slice(0, VISIBLE_LINES).map((line) => (
              <Line key={line.id} line={line} />
            ))}
          </ul>
          {hidden > 0 ? <span className="text-small text-text-muted">+ {hidden} รายการ</span> : null}
          {ticket.status === "accepted" && ticket.acceptedBy ? (
            <span className="text-small text-text-muted">กำลังเตรียม · {ticket.acceptedBy.displayName}</span>
          ) : null}
          {ticket.status === "issue" && ticket.issue ? (
            <span className="text-small text-text-danger">{issueReasonLabel[ticket.issue.reason]}</span>
          ) : null}
        </button>
        {action ? (
          <Button
            fullWidth
            variant={action.kind === "accept" ? "primary" : "secondary"}
            aria-label={`${action.label} ${tag} ${seat}`}
            isPending={pending}
            onPress={() => (action.kind === "issue" ? onOpen() : onAct(action.kind))}
          >
            {action.label}
          </Button>
        ) : null}
      </article>
    </li>
  );
}
