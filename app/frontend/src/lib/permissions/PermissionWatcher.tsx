"use client";

import { toast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { onPermissionDenied } from "@/lib/api/client";
import { MY_PERMISSIONS_KEY } from "@/lib/api/permissions";

const TOAST_GAP_MS = 3000;

/** A 403 with `data.missing` → refetch the permission set (the button disappears) and say why, once per burst. */
export function PermissionWatcher() {
  const client = useQueryClient();

  useEffect(() => {
    let lastToastAt = 0;
    return onPermissionDenied(() => {
      void client.invalidateQueries({ queryKey: MY_PERMISSIONS_KEY });
      const now = Date.now();
      if (now - lastToastAt < TOAST_GAP_MS) return;
      lastToastAt = now;
      toast.danger("ไม่มีสิทธิ์ทำรายการนี้");
    });
  }, [client]);

  return null;
}
