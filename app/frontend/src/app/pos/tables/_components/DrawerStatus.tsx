"use client";

import { Skeleton } from "@heroui/react";
import { LoadError } from "@/components/ui/LoadError";

export function DrawerStatus({
  pending,
  onRetry,
}: Readonly<{
  pending: boolean;
  onRetry: () => void;
}>) {
  if (pending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <Skeleton className="h-8 w-40 rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
        <Skeleton className="h-16 w-full rounded-card" />
      </div>
    );
  }

  return <LoadError title="โหลดข้อมูลโต๊ะไม่สำเร็จ" description="เกิดข้อผิดพลาด" onRetry={onRetry} />;
}
