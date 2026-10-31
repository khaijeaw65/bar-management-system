"use client";

import type { PermissionCode } from "@bar/contracts";
import { Button } from "@heroui/react";
import { LockKeyhole } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { firstAllowedPage, permissionForPath } from "@/lib/permissions/pos-routes";
import { usePermissions } from "@/lib/permissions/usePermissions";

function Forbidden({ can }: Readonly<{ can: (code: PermissionCode) => boolean }>) {
  const router = useRouter();
  const back = firstAllowedPage(can);

  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <LockKeyhole aria-hidden size={40} className="text-text-faint" />
      <h1 className="text-title">ไม่มีสิทธิ์</h1>
      <p className="text-text-muted">บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้</p>
      {back ? (
        <Button onPress={() => router.push(back.href)}>กลับไปหน้า{back.label}</Button>
      ) : (
        <p className="text-text-muted">ติดต่อเจ้าของร้าน</p>
      )}
    </div>
  );
}

/** Wraps the POS page area: the page below renders — and fetches — only once its permission is held. */
export function RequirePermission({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const permissions = usePermissions();
  const needs = permissionForPath(pathname);

  if (needs === null) return <>{children}</>;
  if (permissions.status === "loading") return <div aria-busy="true" aria-label="กำลังโหลดสิทธิ์" className="flex-1" />;
  if (permissions.status === "error") return <LoadError title="โหลดสิทธิ์ไม่สำเร็จ" onRetry={permissions.retry} />;
  if (!permissions.can(needs)) return <Forbidden can={permissions.can} />;
  return <>{children}</>;
}
