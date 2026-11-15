"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDisconnected, useSocketEvent } from "@/hooks/useSocketEvent";
import { getTodayPayments } from "@/lib/api/payments";
import { getTables, TABLES_KEY } from "@/lib/api/tables";

export const TODAY_PAYMENTS_KEY = ["payments", "today"] as const;

export function usePaymentCenter() {
  const queryClient = useQueryClient();

  const tablesQuery = useQuery({
    queryKey: TABLES_KEY,
    queryFn: getTables,
    retry: false,
  });

  const todayQuery = useQuery({
    queryKey: TODAY_PAYMENTS_KEY,
    queryFn: getTodayPayments,
    retry: false,
  });

  const refreshAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TABLES_KEY });
    void queryClient.invalidateQueries({ queryKey: TODAY_PAYMENTS_KEY });
  }, [queryClient]);

  useSocketEvent("payment.status_changed", refreshAll);
  useSocketEvent("visit.opened", refreshAll);
  useSocketEvent("visit.state_changed", refreshAll);
  useSocketEvent("order.created", refreshAll);
  useSocketEvent("table.changed", refreshAll);

  const socketDown = useDisconnected(refreshAll);

  const tables = tablesQuery.data?.items ?? [];
  const occupiedTables = tables.filter((t) => t.currentVisit !== null);
  const pendingQrTables = occupiedTables.filter((t) => Boolean(t.currentVisit?.paymentPending));
  const activeUnpaidTables = occupiedTables.filter((t) => !t.currentVisit?.paymentPending);

  return {
    tablesQuery,
    todayQuery,
    tables,
    pendingQrTables,
    activeUnpaidTables,
    unpaidCount: occupiedTables.length,
    todaySummary: todayQuery.data?.summary,
    businessDate: todayQuery.data?.businessDate ?? "",
    todayItems: todayQuery.data?.items ?? [],
    socketDown,
    refreshAll,
  };
}
