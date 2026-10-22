"use client";

import type { Ticket } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BOARD_KEY } from "@/hooks/useTicketBoard";
import { ApiError } from "@/lib/api/errors";
import { resolveTicket, transitionTicket, type TicketTransition } from "@/lib/api/tickets";
import { orderTag } from "../board";

export function useTicketActions() {
  const client = useQueryClient();
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
    onSuccess: refresh,
    onError: (error, input) => fail(error, input.ticket),
  });

  const resolve = useMutation({
    mutationFn: (ticket: Ticket) => resolveTicket(ticket.id, { resolution: "substitute" }),
    onSuccess: (_data, ticket) => {
      toast.success(`ทำต่อ ${orderTag(ticket.orderNumber)} แล้ว`);
      return refresh();
    },
    onError: (error, ticket) => fail(error, ticket),
  });

  let pendingId: string | null = null;
  if (transition.isPending) pendingId = transition.variables.ticket.id;
  else if (resolve.isPending) pendingId = resolve.variables.id;

  return {
    pendingId,
    act: (ticket: Ticket, kind: TicketTransition) => transition.mutate({ ticket, kind }),
    resolve: (ticket: Ticket) => resolve.mutate(ticket),
  };
}
