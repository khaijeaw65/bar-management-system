"use client";

import { Button, Chip } from "@heroui/react";
import type { VisitDetail } from "@bar/contracts";
import { X } from "lucide-react";
import { visitChip } from "./session-groups";
import { formatElapsed, useMinuteClock } from "./table-time";

export function SessionHeader({
  titleId,
  visit,
  onClose,
}: Readonly<{
  titleId: string;
  visit: VisitDetail;
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
        <p className="text-small text-text-muted">
          เปิด {elapsed} · {visit.guestLabel || "—"}
        </p>
      </div>
      <Button isIconOnly aria-label="ปิด" variant="ghost" onPress={onClose}>
        <X aria-hidden size={18} />
      </Button>
    </header>
  );
}
