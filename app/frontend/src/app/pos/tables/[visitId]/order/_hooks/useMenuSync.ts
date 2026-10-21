"use client";

import { toast } from "@heroui/react";
import type { MenuItem } from "@bar/contracts";
import { useEffect } from "react";
import { lineReason, type CartAction, type CartLine } from "../cart";

export function useMenuSync(
  items: readonly MenuItem[] | undefined,
  lines: readonly CartLine[],
  dispatch: (action: CartAction) => void,
): void {
  useEffect(() => {
    if (!items) return;
    const newly = lines.filter((line) => !line.unavailable && lineReason(line, items));
    const name = newly[0]?.itemName;
    if (!name) return;
    dispatch({ type: "sync", items });
    toast.warning(`${name} หมดแล้ว`);
  }, [items, lines, dispatch]);
}
