"use client";

import { useQuery } from "@tanstack/react-query";
import { getTab } from "@/lib/api/customer";

export const tabKey = ["customer", "tab"] as const;

// Live updates arrive as `tab.changed` pings (useCustomerLive); focus covers a phone that slept.
export function useCustomerTab() {
  return useQuery({ queryKey: tabKey, queryFn: getTab, refetchOnWindowFocus: true });
}
