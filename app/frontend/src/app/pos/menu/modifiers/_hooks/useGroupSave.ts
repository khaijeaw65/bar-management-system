"use client";

import type { CreateModifierGroup, UpdateModifierGroup } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { createModifierGroup, updateModifierGroup } from "@/lib/api/menu";
import { validateGroup, type GroupDraft, type GroupErrors } from "../_lib/group";

// Server 400s come back as one message; show it as the form-level summary.
export function useGroupSave(groupId: string | undefined, draft: GroupDraft, onSaved: () => void) {
  const client = useQueryClient();
  const [errors, setErrors] = useState<GroupErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (payload: CreateModifierGroup | UpdateModifierGroup) =>
      groupId ? updateModifierGroup(groupId, payload as UpdateModifierGroup) : createModifierGroup(payload),
    onSuccess: async () => {
      toast.success("บันทึกกลุ่มแล้ว");
      await client.invalidateQueries({ queryKey: ["menu"] });
      onSaved();
    },
    onError: (error) => setFailure(error instanceof ApiError && error.status === 400 ? error.message : "บันทึกไม่สำเร็จ — ลองอีกครั้ง"),
  });

  return {
    errors,
    failure,
    pending: mutation.isPending,
    submit: () => {
      setFailure(null);
      const result = validateGroup(draft, groupId !== undefined);
      setErrors(result.ok ? {} : result.errors);
      if (result.ok) mutation.mutate(result.payload);
    },
  };
}
