"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSocketEvent } from "./useSocketEvent";

export const VENUE_KEY = ["venue"] as const;

// Kitchen mode and cut-off reach every open POS page without a reload (BRIEF-035).
export function useVenueEvents(): void {
  const client = useQueryClient();
  const refresh = useCallback(() => {
    void client.invalidateQueries({ queryKey: VENUE_KEY });
  }, [client]);
  useSocketEvent("venue.settings_changed", refresh);
}
