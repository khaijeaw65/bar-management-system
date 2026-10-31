"use client";

import type { Ticket } from "@bar/contracts";
import { Button, Chip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId } from "react";
import { getTables } from "@/lib/api/tables";
import { cn } from "@/lib/utils/cn";
import { lineNote } from "../../tables/_components/session-groups";
import { formatThaiTime } from "../../tables/_components/table-time";
import { orderTag, stationLabel } from "../board";
import { IssuePanel } from "./IssuePanel";

const statusLabel = {
  pending: "ใหม่",
  accepted: "กำลังเตรียม",
  ready: "พร้อมเสิร์ฟ",
  issue: "มีปัญหา",
  sent: "เสิร์ฟแล้ว",
  cancelled: "ยกเลิก",
} as const;

export function TicketDrawer({
  ticket,
  kitchenOn,
  canAct,
  resolving,
  onResolve,
  onClose,
}: Readonly<{
  ticket: Ticket;
  kitchenOn: boolean;
  canAct: boolean;
  resolving: boolean;
  onResolve: () => void;
  onClose: () => void;
}>) {
  const titleId = useId();
  const router = useRouter();
  const tables = useQuery({ queryKey: ["tables"], queryFn: getTables, retry: false });
  // Ticket has no visitId: the seat's current visit comes from the floor query.
  const visitId = tables.data?.items.find((seat) => seat.id === ticket.seat.id)?.currentVisit?.id ?? null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      aria-labelledby={titleId}
      className="fixed inset-y-0 right-0 z-30 flex w-100 flex-col gap-4 overflow-y-auto bg-surface-overlay p-6 shadow-(--shadow-dialog)"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-title">
            {orderTag(ticket.orderNumber)} · {ticket.seat.label}
          </h2>
          <p className="text-small text-text-muted">
            สั่งเมื่อ {formatThaiTime(ticket.createdAt)}
            {kitchenOn && ticket.station ? ` · ${stationLabel[ticket.station]}` : ""}
          </p>
        </div>
        <Button isIconOnly variant="ghost" aria-label="ปิด" onPress={onClose}>
          <X aria-hidden size={20} />
        </Button>
      </header>
      <Chip size="sm" variant="soft" className="self-start">
        {statusLabel[ticket.status]}
        {ticket.status === "accepted" && ticket.acceptedBy ? ` · ${ticket.acceptedBy.displayName}` : ""}
      </Chip>
      {ticket.status === "issue" ? <IssuePanel ticket={ticket} canAct={canAct} pending={resolving} onResolve={onResolve} /> : null}
      <ul className="flex flex-col gap-3">
        {ticket.items.map((line) => {
          const note = lineNote(line);
          return (
            <li key={line.id}>
              <p className={cn("text-body-md", line.cancelledAt && "text-text-muted line-through")}>
                {line.quantity}× {line.name}
                {line.variantName === "ปกติ" ? "" : ` (${line.variantName})`}
              </p>
              {note ? <p className="text-small text-text-muted">{note}</p> : null}
            </li>
          );
        })}
      </ul>
      <Button
        variant="secondary"
        isDisabled={visitId === null}
        onPress={() => visitId && router.push(`/pos/tables?visit=${visitId}`)}
      >
        ไปที่โต๊ะ {ticket.seat.label}
      </Button>
    </aside>
  );
}
