"use client";

import type { Ticket } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BOARD_KEY } from "@/hooks/useTicketBoard";
import { ApiError } from "@/lib/api/errors";
import { resolveTicket, transitionTicket, type TicketTransition } from "@/lib/api/tickets";
import { orderTag } from "../board";

export function useTicketActions() {
  const client = useQueryClient();
  // One entry per in-flight ticket, so a second tap never clears the first card's spinner.
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const track = (id: string) => setPendingIds((current) => new Set(current).add(id));
  const untrack = (id: string) =>
    setPendingIds((current) => new Set([...current].filter((pending) => pending !== id)));
  // Returned so the button stays pending until the board shows the server's answer.
  const refresh = () => client.invalidateQueries({ queryKey: BOARD_KEY });

  function fail(error: unknown, ticket: Ticket) {
    if (error instanceof ApiError && error.status === 409) {
      toast.warning(`ออเดอร์ ${orderTag(ticket.orderNumber)} เปลี่ยนสถานะแล้ว`);
    } else {
      toast.danger("ทำรายการไม่สำเร็จ ลองอีกครั้ง");
    }
    return refresh();
  }

  const transition = useMutation({
    mutationFn: (input: { ticket: Ticket; kind: TicketTransition }) =>
      transitionTicket(input.ticket.id, input.kind),
    onMutate: (input) => track(input.ticket.id),
    onSuccess: refresh,
    onError: (error, input) => fail(error, input.ticket),
    onSettled: (_data, _error, input) => untrack(input.ticket.id),
  });

  const resolve = useMutation({
    mutationFn: (ticket: Ticket) => resolveTicket(ticket.id, { resolution: "substitute" }),
    onMutate: (ticket) => track(ticket.id),
    onSuccess: (_data, ticket) => {
      toast.success(`ทำต่อ ${orderTag(ticket.orderNumber)} แล้ว`);
      return refresh();
    },
    onError: (error, ticket) => fail(error, ticket),
    onSettled: (_data, _error, ticket) => untrack(ticket.id),
  });

  return {
    pendingIds,
    act: (ticket: Ticket, kind: TicketTransition) => transition.mutate({ ticket, kind }),
    resolve: (ticket: Ticket) => resolve.mutate(ticket),
  };
}
