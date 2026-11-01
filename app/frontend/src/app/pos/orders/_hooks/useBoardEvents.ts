"use client";

import { MenuAvailabilityChangedPayloadSchema, OrderCreatedPayloadSchema } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { BOARD_KEY } from "@/hooks/useTicketBoard";

const HIGHLIGHT_MS = 3_000;

// Refetching is the shared hook's job; this adds what only the board shows: toasts and the new-card highlight.
export function useBoardEvents(onSelectTicket?: (ticketId: string) => void): ReadonlySet<string> {
  const client = useQueryClient();
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const live = timers.current;
    return () => {
      for (const timer of live) clearTimeout(timer);
    };
  }, []);

  const onCreated = useCallback(
    (payload: unknown) => {
      const parsed = OrderCreatedPayloadSchema.safeParse(payload);
      if (!parsed.success) return;
      const ids = parsed.data.tickets.map((ticket) => ticket.id);
      setFresh((current) => new Set([...current, ...ids]));
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        setFresh((current) => new Set([...current].filter((id) => !ids.includes(id))));
      }, HIGHLIGHT_MS);
      timers.current.add(timer);
      const seats = [...new Set(parsed.data.tickets.map((ticket) => ticket.seat.label))];
      const firstTicketId = parsed.data.tickets[0]?.id;
      const toastId = toast.success(`ออเดอร์ใหม่ ${seats.join(", ")}`, {
        actionProps:
          firstTicketId && onSelectTicket
            ? {
                children: "ดูออเดอร์",
                onPress: () => {
                  onSelectTicket(firstTicketId);
                  toast.close(String(toastId));
                },
              }
            : undefined,
      });
    },
    [onSelectTicket],
  );

  const onAvailability = useCallback(
    (payload: unknown) => {
      const parsed = MenuAvailabilityChangedPayloadSchema.safeParse(payload);
      if (!parsed.success) return;
      void client.invalidateQueries({ queryKey: BOARD_KEY });
      const { name, isAvailable, autoVoided, notVoided } = parsed.data;
      if (isAvailable || (autoVoided.length === 0 && notVoided.length === 0)) return;
      const seatsOf = (rows: readonly { seatLabel: string }[]) => [...new Set(rows.map((row) => row.seatLabel))].join(", ");
      const count = autoVoided.reduce((sum, row) => sum + row.itemCount, 0);
      const title =
        autoVoided.length > 0
          ? `${name} หมด — ยกเลิกอัตโนมัติ ${count} รายการ · แจ้งลูกค้าโต๊ะ ${seatsOf(autoVoided)}`
          : `${name} หมด`;
      toast.warning(title, {
        description:
          notVoided.length > 0 ? `กำลังทำอยู่ / รอชำระ — ตรวจกับลูกค้า: ${seatsOf(notVoided)}` : undefined,
      });
    },
    [client],
  );

  useSocketEvent("order.created", onCreated);
  useSocketEvent("menu.availability_changed", onAvailability);
  return fresh;
}
