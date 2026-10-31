"use client";

import type { TicketList } from "@bar/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getBoardTickets } from "@/lib/api/tickets";
import { usePermissions } from "@/lib/permissions/usePermissions";
import { useSocketEvent } from "./useSocketEvent";

export const BOARD_KEY = ["tickets", "board"] as const;

function isOlder(shown: string, incoming: unknown): boolean {
  return typeof incoming === "string" && Date.parse(incoming) < Date.parse(shown);
}

// One query feeds the board and the rail Badge, so they never disagree (BRIEF-032 §3b).
export function useTicketBoard() {
  // Without orders:read the endpoint answers 403, so it is never asked (BRIEF-056).
  const allowed = usePermissions().can("orders:read");
  return useQuery({ queryKey: BOARD_KEY, queryFn: getBoardTickets, retry: false, enabled: allowed });
}

// Mounted once per POS page: every useTicketBoard() caller would otherwise add its own listeners and refetch.
export function useTicketBoardEvents(): void {
  const client = useQueryClient();

  const refresh = useCallback(() => {
    void client.invalidateQueries({ queryKey: BOARD_KEY });
  }, [client]);

  const onChanged = useCallback(
    (payload: unknown) => {
      const data = payload as { ticketId?: unknown; updatedAt?: unknown } | null;
      const shown = client
        .getQueryData<TicketList>(BOARD_KEY)
        ?.items.find((ticket) => ticket.id === data?.ticketId);
      if (shown && isOlder(shown.updatedAt, data?.updatedAt)) return;
      refresh();
    },
    [client, refresh],
  );

  useSocketEvent("order.created", refresh);
  useSocketEvent("ticket.status_changed", onChanged);
  useSocketEvent("ticket.issue_escalated", onChanged);
}

export function usePendingTicketCount(): number {
  const board = useTicketBoard();
  return board.data?.items.filter((ticket) => ticket.status === "pending").length ?? 0;
}

// "ออเดอร์ใหม่ n" on a table card: same board data as the rail Badge (BRIEF-051).
export function pendingBySeat(tickets: readonly TicketList["items"][number][]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    if (ticket.status === "pending") counts.set(ticket.seat.id, (counts.get(ticket.seat.id) ?? 0) + 1);
  }
  return counts;
}

export function usePendingBySeat(): ReadonlyMap<string, number> {
  const board = useTicketBoard();
  return pendingBySeat(board.data?.items ?? []);
}
