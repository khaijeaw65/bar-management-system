"use client";

import type { Ticket } from "@bar/contracts";
import { Chip, Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import type { ColumnDef } from "../board";

export function BoardColumn({
  column,
  tickets,
  loading = false,
  children,
}: Readonly<{
  column: ColumnDef;
  tickets: readonly Ticket[];
  loading?: boolean;
  children?: ReactNode;
}>) {
  return (
    <section aria-label={column.label} aria-busy={loading || undefined} className="flex min-w-0 flex-col gap-3 rounded-card bg-bg-sunken p-3">
      <h2 className="flex items-center justify-between text-subhead">
        {column.label}
        {loading ? null : (
          <Chip size="sm" variant="soft">
            {tickets.length}
          </Chip>
        )}
      </h2>
      {loading ? (
        <>
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </>
      ) : tickets.length === 0 ? (
        <p className="py-6 text-center text-small text-text-faint">ไม่มีออเดอร์</p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}
