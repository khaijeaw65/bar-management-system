"use client";

import type { PermissionCode } from "@bar/contracts";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getMyPermissions, MY_PERMISSIONS_KEY } from "@/lib/api/permissions";

export type PermissionsStatus = "loading" | "ready" | "error";

const REFRESH_MS = 60_000;

export interface Permissions {
  status: PermissionsStatus;
  /** False for every code until the first answer arrives — gated buttons never flash. */
  can: (code: PermissionCode) => boolean;
  canAll: (...codes: PermissionCode[]) => boolean;
  canAny: (...codes: PermissionCode[]) => boolean;
  retry: () => void;
}

/** The server stays the truth (BRIEF-056): refetched on focus, every minute, and after any 403 with `data.missing`. */
export function usePermissions(): Permissions {
  const query = useQuery({
    queryKey: MY_PERMISSIONS_KEY,
    queryFn: getMyPermissions,
    retry: false,
    staleTime: 30_000,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
  const granted = query.data?.permissions;
  const refetch = query.refetch;

  return useMemo(() => {
    const set = new Set<PermissionCode>(granted ?? []);
    const can = (code: PermissionCode) => set.has(code);
    return {
      status: granted ? "ready" : query.isError ? "error" : "loading",
      can,
      canAll: (...codes) => codes.every(can),
      canAny: (...codes) => codes.some(can),
      retry: () => void refetch(),
    };
  }, [granted, query.isError, refetch]);
}
