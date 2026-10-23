"use client";

import { PaymentStatusChangedPayloadSchema } from "@bar/contracts";
import { useQuery } from "@tanstack/react-query";
import { useDisconnected, useSocketEvent } from "@/hooks/useSocketEvent";
import { getReportToday } from "@/lib/api/reports";

export const TODAY_KEY = ["reports", "today"] as const;
const REFRESH_MS = 60_000;

export function useTodayReport() {
  const today = useQuery({ queryKey: TODAY_KEY, queryFn: getReportToday, refetchInterval: REFRESH_MS });
  const refresh = () => void today.refetch();

  useSocketEvent("order.created", refresh);
  useSocketEvent("payment.status_changed", (payload) => {
    const parsed = PaymentStatusChangedPayloadSchema.safeParse(payload);
    if (parsed.success && parsed.data.status === "completed") refresh();
  });
  const socketDown = useDisconnected(refresh);

  // A failed refetch keeps the last numbers on screen (CD-05 §4) and only greys the live dot.
  return { today, stale: socketDown || (today.isError && today.data !== undefined) };
}
