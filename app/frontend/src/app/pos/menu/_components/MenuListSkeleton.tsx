import { Skeleton } from "@heroui/react";

export function MenuListSkeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดเมนู" className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
