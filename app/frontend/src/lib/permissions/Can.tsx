"use client";

import type { PermissionCode } from "@bar/contracts";
import type { ReactNode } from "react";
import { usePermissions } from "./usePermissions";

/** Renders children only when the person holds `code` (or any of `anyOf`); `fallback` otherwise and while loading. */
export function Can({
  code,
  anyOf,
  fallback = null,
  children,
}: Readonly<{
  code?: PermissionCode;
  anyOf?: PermissionCode[];
  fallback?: ReactNode;
  children: ReactNode;
}>) {
  const { can, canAny } = usePermissions();
  const allowed = (code !== undefined && can(code)) || (anyOf !== undefined && canAny(...anyOf));
  return <>{allowed ? children : fallback}</>;
}
