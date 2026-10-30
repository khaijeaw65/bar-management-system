"use client";

import { useQuery } from "@tanstack/react-query";
import { getPayment } from "@/lib/api/customer";

export const paymentKey = ["customer", "payment"] as const;

// Live updates arrive as `tab.changed` pings (useCustomerLive), which fire on every payment status change too.
export function useCustomerPayment() {
  return useQuery({ queryKey: paymentKey, queryFn: getPayment, refetchOnWindowFocus: true });
}
