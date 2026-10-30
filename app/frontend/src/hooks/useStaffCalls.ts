"use client";

import type { StaffCall, TableSummary } from "@bar/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { acknowledgeCall, getTables, TABLES_KEY } from "@/lib/api/tables";

export interface OpenCall {
  seat: TableSummary;
  call: StaffCall;
}

// Same key and fn as the floor grid, so the card, drawer and top-bar list read one cache.
export function useTables() {
  return useQuery({ queryKey: TABLES_KEY, queryFn: getTables, retry: false });
}

export function useOpenCalls(): OpenCall[] {
  const tables = useTables();
  const calls: OpenCall[] = [];
  for (const seat of tables.data?.items ?? []) {
    if (seat.staffCall) calls.push({ seat, call: seat.staffCall });
  }
  return calls.sort((a, b) => Date.parse(b.call.calledAt) - Date.parse(a.call.calledAt));
}

export function useAcknowledgeCall() {
  const client = useQueryClient();

  function setCall(seatId: string, staffCall: StaffCall | null) {
    client.setQueryData<{ items: TableSummary[] }>(TABLES_KEY, (current) =>
      current && { ...current, items: current.items.map((seat) => (seat.id === seatId ? { ...seat, staffCall } : seat)) },
    );
  }

  return useMutation({
    mutationFn: acknowledgeCall,
    onMutate: async (seatId) => {
      await client.cancelQueries({ queryKey: TABLES_KEY });
      const previous = client
        .getQueryData<{ items: TableSummary[] }>(TABLES_KEY)
        ?.items.find((seat) => seat.id === seatId)?.staffCall;
      setCall(seatId, null);
      return { previous };
    },
    // Restore just this seat's bell so a WS update for another seat is not rolled back with it.
    onError: (_error, seatId, context) => {
      if (context?.previous) setCall(seatId, context.previous);
      toast.danger("ยังรับทราบไม่ได้ ลองอีกครั้ง");
    },
  });
}
