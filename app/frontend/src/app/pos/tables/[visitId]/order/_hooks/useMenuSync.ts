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
    const first = lines.find((line) => !line.unavailable && lineReason(line, items));
    if (!first) return;
    dispatch({ type: "sync", items });
    toast.warning(`${first.itemName} หมดแล้ว`);
  }, [items, lines, dispatch]);
}
