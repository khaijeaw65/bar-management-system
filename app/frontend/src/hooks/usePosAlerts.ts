"use client";

import { OrderCreatedPayloadSchema, TableStaffCalledPayloadSchema, type TableList } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useAcknowledgeCall } from "@/hooks/useStaffCalls";
import { TABLES_KEY } from "@/lib/api/tables";
import { callTitle, isGuestOrder, orderTag } from "@/lib/pos/alerts";
import { playChime, unlockAudio } from "@/lib/sound/chime";
import { useSocketEvent } from "./useSocketEvent";
import { useSoundState } from "./useSoundState";

// The first tap anywhere in the POS is the user gesture browsers need before audio may play.
// Re-armed whenever the context is locked again (a tablet that slept), so any tap restores sound.
function useAudioUnlock(): void {
  const { locked } = useSoundState();
  useEffect(() => {
    if (!locked) return;
    const unlock = () => unlockAudio();
    document.addEventListener("pointerdown", unlock, { once: true, capture: true });
    return () => document.removeEventListener("pointerdown", unlock, { capture: true });
  }, [locked]);
}

// Mounted once in BoardEvents: bell and guest-order cues on every POS page (BRIEF-051).
export function usePosAlerts(): void {
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const acknowledge = useAcknowledgeCall();
  useAudioUnlock();

  const refreshTables = useCallback(() => {
    void client.invalidateQueries({ queryKey: TABLES_KEY });
  }, [client]);

  const onCalled = useCallback(
    (payload: unknown) => {
      const parsed = TableStaffCalledPayloadSchema.safeParse(payload);
      if (!parsed.success) return;
      refreshTables();
      playChime("bell");
      const label = client.getQueryData<TableList>(TABLES_KEY)?.items.find((s) => s.id === parsed.data.tableSeatId)?.label;
      const toastId = toast.warning(callTitle(label ?? "โต๊ะ", parsed.data), {
        actionProps: {
          children: "รับทราบ",
          onPress: () => {
            acknowledge.mutate(parsed.data.tableSeatId);
            toast.close(String(toastId));
          },
        },
      });
    },
    [acknowledge, client, refreshTables],
  );

  const onOrder = useCallback(
    (payload: unknown) => {
      const parsed = OrderCreatedPayloadSchema.safeParse(payload);
      if (!parsed.success || !isGuestOrder(parsed.data)) return;
      playChime("order");
      // The orders board already toasts every new order; a second one there would only repeat it.
      if (pathname === "/pos/orders") return;
      const label = parsed.data.tickets[0]?.seat.label ?? "โต๊ะ";
      toast.success(`ออเดอร์ใหม่จาก QR · ${label} · ${orderTag(parsed.data.orderNumber)}`, {
        actionProps: { children: "ดูออเดอร์", onPress: () => router.push("/pos/orders") },
      });
    },
    [pathname, router],
  );

  useSocketEvent("table.staff_called", onCalled);
  useSocketEvent("table.staff_call_cleared", refreshTables);
  useSocketEvent("order.created", onOrder);
}
