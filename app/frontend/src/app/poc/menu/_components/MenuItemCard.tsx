"use client";

import { Card, Chip } from "@heroui/react";
import { cn } from "@/lib/utils/cn";
import type { MenuItem } from "./menu-data";

interface MenuItemCardProps {
  item: MenuItem;
}

/** --dur-fast and --ease-out. Brief §7.6: no press scale. */
const motion = "duration-[140ms] ease-[cubic-bezier(.2,0,0,1)]";

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 rounded-[12px] border border-line bg-surface-card p-0 pb-3 shadow-[var(--shadow-card),var(--highlight-top)] transition-[background-color]",
        motion,
        item.soldOut ? "opacity-50" : "hover:bg-surface-hover",
      )}
    >
      {/* rounded --r-card. Shadow is --shadow-card plus --highlight-top. Thumb height 108 is the DS literal. */}
      <div className="grid h-[108px] place-items-center rounded-t-[12px] bg-surface-raised text-[20px] font-bold leading-none text-text-faint">
        {Array.from(item.name)[0]}
      </div>
      <div className="min-w-0 px-3">
        <div className="text-[15px] font-semibold leading-[1.62] text-text-body">{item.name}</div>
        {/* --text-body-strong. No line clamp: the board wraps the name. */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[19px] font-bold leading-[1.3] text-text-accent tabular-nums">{item.price}</span>
          {/* --text-price */}
          {item.soldOut ? <SoldOutChip /> : null}
        </div>
      </div>
    </Card>
  );
}

function SoldOutChip() {
  return (
    <Chip className="gap-1.5 rounded-full border border-transparent bg-status-void-bg px-2.5 py-1 text-[11px] font-semibold leading-[1.4] text-status-void-fg tabular-nums">
      {/* Badge md: 11/1.4, pad 4×10, gap 6, dot 6. Soft void fill. */}
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-status-void" />
      หมด
    </Chip>
  );
}
