"use client";

import { Chip } from "@heroui/react";
import type { OrderLine } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { formatTHB } from "@/lib/utils/format";
import { lineNote, lineTitle } from "./session-groups";

export function OrderLineRow({
  line,
  lines,
}: Readonly<{
  line: OrderLine;
  lines: readonly OrderLine[];
}>) {
  const cancelled = line.cancelledAt !== null;
  const note = lineNote(line);

  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className={cn("text-body-md", cancelled && "text-text-muted line-through")}>{lineTitle(line, lines)}</p>
        {note ? <p className="text-small text-text-muted">{note}</p> : null}
        {cancelled ? (
          <Chip size="sm" color="danger" variant="soft">
            ยกเลิก
          </Chip>
        ) : null}
      </div>
      <span className={cn("text-price tabular-nums", cancelled ? "text-text-muted" : "text-text-body")}>
        {formatTHB(line.lineTotal)}
      </span>
    </li>
  );
}
