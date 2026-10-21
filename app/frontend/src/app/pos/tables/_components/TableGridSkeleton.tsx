"use client";

import { Skeleton } from "@heroui/react";

export function TableGridSkeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดโต๊ะ" className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-pill" />
        <Skeleton className="h-6 w-16 rounded-pill" />
        <Skeleton className="h-6 w-16 rounded-pill" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,7.5rem)] gap-3">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((key) => (
          <Skeleton key={key} className="h-24 w-30 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-3">
        {["a", "b", "c", "d", "e", "f"].map((key) => (
          <Skeleton key={key} className="h-35 rounded-card" />
        ))}
      </div>
    </div>
  );
}
