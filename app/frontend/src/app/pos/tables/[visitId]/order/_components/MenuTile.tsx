"use client";

import type { MenuItem } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { tilePrice } from "@/lib/order/catalog";
import { unavailableLabel } from "../catalog";

export function MenuTile({
  item,
  count,
  locked,
  onPick,
}: Readonly<{
  item: MenuItem;
  count: number;
  locked: boolean;
  onPick: (item: MenuItem) => void;
}>) {
  const status = unavailableLabel(item);
  const price = tilePrice(item);
  const held = count > 0 ? `, ในตะกร้า ${count}` : "";
  const label = status ? `${item.name} ${status}` : `${item.name} ${price}${held}`;

  return (
    <li>
      <button
        type="button"
        aria-label={label}
        disabled={locked || status !== null}
        onClick={() => onPick(item)}
        className={cn(
          "relative flex h-24 w-full flex-col items-start justify-between rounded-card border border-line bg-surface-card p-3 text-left shadow-(--shadow-card)",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
          status ? "text-text-faint opacity-50" : "text-text-body",
          count > 0 && !status && "border-line-accent",
        )}
      >
        <span className="line-clamp-2 text-label">{item.name}</span>
        <span className={cn("text-small tabular-nums", status ? "text-text-faint" : "text-text-accent")}>
          {status ?? price}
        </span>
        {count > 0 ? (
          <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-pill bg-accent text-small text-text-on-accent">
            {count}
          </span>
        ) : null}
      </button>
    </li>
  );
}
