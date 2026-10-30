"use client";

import type { CustomerMenuItem } from "@bar/contracts";
import { Plus } from "lucide-react";
import { tilePrice } from "@/lib/order/catalog";
import { cn } from "@/lib/utils/cn";
import { statusLabel, windowNote } from "../../_lib/menu";
import { MenuPhoto } from "./MenuPhoto";

export function MenuCard({
  item,
  count,
  onPick,
}: Readonly<{ item: CustomerMenuItem; count: number; onPick: (item: CustomerMenuItem) => void }>) {
  const status = statusLabel(item);
  const note = status === "หมด" ? null : (status ?? windowNote(item));
  return (
    <li className={cn("flex flex-col overflow-hidden rounded-card border border-line bg-surface-card", status && "opacity-50")}>
      <button
        type="button"
        aria-label={`ดู ${item.name}`}
        disabled={status !== null}
        onClick={() => onPick(item)}
        className="flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <MenuPhoto item={item} count={count} />
        <span className="line-clamp-2 min-h-10 px-3 pt-2 text-body-strong text-text-body">{item.name}</span>
        {note ? <span className="px-3 text-small text-text-muted">{note}</span> : null}
      </button>
      <div className="flex items-center justify-between px-3 pt-1 pb-3">
        <span className="text-price text-text-accent tabular-nums">{status === "หมด" ? status : tilePrice(item)}</span>
        {status ? null : (
          <button
            type="button"
            aria-label={`เพิ่ม ${item.name}`}
            onClick={() => onPick(item)}
            className="flex size-11 items-center justify-center rounded-pill bg-accent text-text-on-accent"
          >
            <Plus aria-hidden size={20} />
          </button>
        )}
      </div>
    </li>
  );
}
