"use client";

import { useQuery } from "@tanstack/react-query";
import { getMenu } from "@/lib/api/customer";

// Live sold-out comes over WS in C4; until then a 60 s refetch plus focus keeps the menu fresh (DR-010).
export function useCustomerMenu() {
  return useQuery({
    queryKey: ["customer", "menu"],
    queryFn: getMenu,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
