"use client";

import { Button, Chip } from "@heroui/react";
import type { OrderLine } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { formatTHB } from "@/lib/utils/format";
import { lineNote, lineTitle } from "./session-groups";

export function OrderLineRow({
  line,
  lines,
  onAdjust,
  disabled,
}: Readonly<{
  line: OrderLine;
  lines: readonly OrderLine[];
  onAdjust?: (line: OrderLine) => void;
  disabled?: boolean;
}>) {
  const cancelled = line.cancelledAt !== null;
  const isComp = !cancelled && line.lineTotal === "0.00";
  const note = lineNote(line);

  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-body-md", cancelled && "text-text-muted line-through")}>
            {lineTitle(line, lines)}
          </p>
          {cancelled ? (
            <Chip size="sm" color="danger" variant="soft">
              ยกเลิก
            </Chip>
          ) : null}
          {isComp ? (
            <Chip size="sm" color="warning" variant="soft">
              Comp
            </Chip>
          ) : null}
        </div>
        {note ? <p className="text-small text-text-muted">{note}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-price tabular-nums", cancelled ? "text-text-muted" : "text-text-body")}>
          {formatTHB(line.lineTotal)}
        </span>
        {!cancelled && !isComp && onAdjust ? (
          <Button
            size="sm"
            variant="ghost"
            isDisabled={disabled}
            onPress={() => onAdjust(line)}
            aria-label="ยกเลิก / Comp"
            className="text-small text-text-muted hover:text-text-body"
          >
            ยกเลิก / Comp
          </Button>
        ) : null}
      </div>
    </li>
  );
}
