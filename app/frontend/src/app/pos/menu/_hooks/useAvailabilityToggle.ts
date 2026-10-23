"use client";

import type { MenuItem } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { setMenuItemAvailable } from "@/lib/api/menu";

// The Switch flips at once; a failed call puts it back with a Toast (CD-12 list·6).
export function useAvailabilityToggle(item: MenuItem) {
  const client = useQueryClient();
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const mutation = useMutation({
    mutationFn: (available: boolean) => setMenuItemAvailable(item.id, available),
    onMutate: (available) => setOptimistic(available),
    onSuccess: (_result, available) => {
      toast.success(
        available ? `${item.name} พร้อมขายแล้ว` : `${item.name} หมดแล้ว`,
        {
          description: available
            ? "กลับมาสั่งได้ทุกหน้าจอทันที"
            : "ลูกค้าและ POS เห็นเป็นสีเทา สั่งไม่ได้ จนกว่าจะเปิดอีกครั้ง",
        },
      );
    },
    onError: (_error, available) => {
      toast.danger("เปลี่ยนสถานะไม่สำเร็จ", {
        description: `${item.name} ยัง${available ? "หมดอยู่" : "พร้อมขาย"} — ลองอีกครั้ง`,
      });
    },
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: ["menu"] });
      setOptimistic(null);
    },
  });

  return {
    available: optimistic ?? item.unavailableReason !== "sold_out",
    pending: mutation.isPending,
    toggle: (available: boolean) => mutation.mutate(available),
  };
}
