"use client";

import { toast } from "@heroui/react";
import { useCallback } from "react";
import type { CartAction } from "@/lib/order/cart";
import type { SheetResult } from "../menu/_components/ItemSheet";

// Applies what the item sheet returned: add a line, or change / remove the guest's existing one.
export function useSheetResult(dispatch: (action: CartAction) => void, onDone: () => void) {
  return useCallback(
    (result: SheetResult) => {
      if (result.kind === "add") {
        dispatch({ type: "add", line: result.line });
        toast.success(`เพิ่ม ${result.line.itemName} แล้ว`);
      } else if (result.quantity === 0) {
        dispatch({ type: "remove", id: result.existing.id });
        toast(`ลบ ${result.existing.itemName} ออกจากตะกร้าแล้ว`);
      } else if (result.line.notes === result.existing.notes) {
        dispatch({ type: "qty", id: result.existing.id, quantity: result.quantity });
      } else {
        dispatch({ type: "remove", id: result.existing.id });
        dispatch({ type: "add", line: { ...result.line, quantity: result.quantity } });
      }
      onDone();
    },
    [dispatch, onDone],
  );
}
