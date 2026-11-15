"use client";

import { Chip } from "@heroui/react";
import type { OrderLine } from "@bar/contracts";
import { formatThaiTime } from "./table-time";
import { OrderLineRow } from "./OrderLineRow";
import type { SessionGroup } from "./session-groups";

export function OrderGroup({
  group,
  onAdjust,
  disabled,
}: Readonly<{
  group: SessionGroup;
  onAdjust?: (line: OrderLine) => void;
  disabled?: boolean;
}>) {
  return (
    <section className="flex flex-col gap-2 border-b border-line-hairline py-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-small text-text-muted">{formatThaiTime(group.createdAt)}</span>
        <span className="text-small">#{group.orderNumber}</span>
        <Chip size="sm" color={group.chipColor} variant="soft">
          {group.chip}
        </Chip>
        {group.stationLabel ? <span className="text-label text-text-muted">{group.stationLabel}</span> : null}
      </header>
      <ul className="flex flex-col gap-2">
        {group.lines.map((line) => (
          <OrderLineRow
            key={line.id}
            line={line}
            lines={group.lines}
            onAdjust={onAdjust}
            disabled={disabled}
          />
        ))}
      </ul>
    </section>
  );
}
