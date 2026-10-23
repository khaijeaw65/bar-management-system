"use client";

import { MENU_AVAILABILITY_CHANGED, MENU_CHANGED } from "@bar/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSocketEvent } from "./useSocketEvent";

// Any menu write or sold-out toggle, from any device, refreshes every mounted ["menu", …] query.
export function useMenuLive(): void {
  const client = useQueryClient();
  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: ["menu"] });
  }, [client]);

  useSocketEvent(MENU_CHANGED, invalidate);
  useSocketEvent(MENU_AVAILABILITY_CHANGED, invalidate);
}
