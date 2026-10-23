"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { deleteModifierGroup } from "@/lib/api/menu";

export function useDeleteGroup() {
  const client = useQueryClient();
  const [target, setTarget] = useState<ModifierGroupAdmin | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: ["menu"] });
  const mutation = useMutation({
    mutationFn: (id: string) => deleteModifierGroup(id),
    onSuccess: async () => {
      setTarget(null);
      toast.success("ลบกลุ่มแล้ว");
      await refresh();
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === "MODIFIER_GROUP_IN_USE") {
        setTarget(null);
        toast.danger("ใช้อยู่ในเมนู — ถอดออกจากเมนูก่อน");
        await refresh();
      }
    },
  });

  return {
    target,
    pending: mutation.isPending,
    failed: mutation.isError,
    ask: (group: ModifierGroupAdmin) => {
      mutation.reset();
      setTarget(group);
    },
    cancel: () => setTarget(null),
    confirm: () => target && mutation.mutate(target.id),
  };
}
