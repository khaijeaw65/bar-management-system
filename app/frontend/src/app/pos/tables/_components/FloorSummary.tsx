"use client";

import { Chip } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";

export function FloorSummary({ items }: Readonly<{ items: TableSummary[] }>) {
  const inUse = items.filter((seat) => seat.currentVisit !== null).length;

  return (
    <div className="flex gap-2">
      <Chip size="sm">ใช้งาน {inUse}</Chip>
      <Chip size="sm">ว่าง {items.length - inUse}</Chip>
    </div>
  );
}
