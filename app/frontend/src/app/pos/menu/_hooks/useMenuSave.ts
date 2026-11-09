"use client";

import { MenuItemSchema, type CreateMenuItem, type MenuItem, type UpdateMenuItem } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { createMenuItem, updateMenuItem } from "@/lib/api/menu";
import { generateUuid } from "@/lib/utils/uuid";
import { renamesOf, validate, type MenuDraft, type Rename } from "../_lib/draft";

function staleCopy(error: unknown): MenuItem | null {
  if (!(error instanceof ApiError) || error.status !== 409 || error.code !== "MENU_ITEM_STALE") return null;
  const details = (error.data as { details?: unknown } | null)?.details;
  const parsed = MenuItemSchema.safeParse(details);
  return parsed.success ? parsed.data : null;
}

export function useMenuSave({ item, base, draft }: Readonly<{ item: MenuItem | undefined; base: MenuDraft; draft: MenuDraft }>) {
  const client = useQueryClient();
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);
  const [renames, setRenames] = useState<Rename[] | null>(null);
  const [stale, setStale] = useState<MenuItem | null>(null);
  // One key per payload: a retry of the same body replays, an edited body starts a new request.
  const keyed = useRef({ body: "", key: generateUuid() });

  const mutation = useMutation({
    mutationFn: (payload: CreateMenuItem | UpdateMenuItem) => {
      if (item) return updateMenuItem(item.id, payload as UpdateMenuItem);
      const body = JSON.stringify(payload);
      if (keyed.current.body !== body) keyed.current = { body, key: generateUuid() };
      return createMenuItem(payload as CreateMenuItem, keyed.current.key);
    },
    onSuccess: (saved) => {
      void client.invalidateQueries({ queryKey: ["menu"] });
      toast.success("บันทึกเมนูแล้ว", { description: `${saved.name} · ${saved.variants.length} ตัวเลือก` });
      router.push(`/pos/menu?highlight=${saved.id}`);
    },
    onError: (error) => setStale(staleCopy(error)),
  });

  const result = validate(draft, item?.updatedAt);
  const send = () => {
    if (result.ok && !mutation.isPending) mutation.mutate(result.payload);
  };

  return {
    errors: attempted && !result.ok ? result.errors : {},
    renames,
    stale,
    pending: mutation.isPending,
    failure: mutation.isError && !stale ? mutation.error.message : null,
    submit: () => {
      setAttempted(true);
      if (!result.ok) return;
      const changed = item ? renamesOf(base, draft) : [];
      if (changed.length > 0) setRenames(changed);
      else send();
    },
    confirmRename: () => {
      setRenames(null);
      send();
    },
    cancelRename: () => setRenames(null),
    clearStale: () => {
      setStale(null);
      mutation.reset();
    },
  };
}
