"use client";

import { Button, Chip } from "@heroui/react";
import type { VisitDetail } from "@bar/contracts";
import { X } from "lucide-react";
import { OrderEntryButton } from "./OrderEntryButton";
import { visitChip } from "./session-groups";
import { formatElapsed, useMinuteClock } from "./table-time";

export function SessionHeader({
  titleId,
  visit,
  hasOrders,
  onClose,
}: Readonly<{
  titleId: string;
  visit: VisitDetail;
  hasOrders: boolean;
  onClose: () => void;
}>) {
  const now = useMinuteClock();
  const elapsed = now === null ? "--:--" : formatElapsed(visit.openedAt, now);

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={titleId} className="text-heading">
            โต๊ะ {visit.seatLabel}
          </h2>
          <Chip size="sm" variant="soft">
            {visitChip(visit.state)}
          </Chip>
        </div>
        <p className="flex flex-wrap items-center gap-2 text-small text-text-muted">
          <span>
            เปิด {elapsed} · {visit.guestLabel || "—"}
          </span>
          {hasOrders ? <OrderEntryButton visitId={visit.id} /> : null}
        </p>
      </div>
      <Button isIconOnly aria-label="ปิด" variant="ghost" onPress={onClose}>
        <X aria-hidden size={18} />
      </Button>
    </header>
  );
}
