"use client";

import type { CustomerMenuItem } from "@bar/contracts";
import type { CartLine } from "@/lib/order/cart";
import { countInCart } from "../../_lib/menu";
import { MenuCard } from "./MenuCard";

export function MenuGrid({
  items,
  lines,
  onPick,
}: Readonly<{ items: readonly CustomerMenuItem[]; lines: readonly CartLine[]; onPick: (item: CustomerMenuItem) => void }>) {
  return (
    <ul className="grid grid-cols-2 gap-3 px-4 pb-28">
      {items.map((item) => (
        <MenuCard key={item.id} item={item} count={countInCart(lines, item.id)} onPick={onPick} />
      ))}
    </ul>
  );
}
