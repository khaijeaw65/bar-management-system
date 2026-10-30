"use client";

import { Skeleton } from "@heroui/react";
import type { CustomerMenuItem } from "@bar/contracts";
import { PackageOpen } from "lucide-react";
import { LoadError } from "@/components/ui/LoadError";
import type { CartLine } from "@/lib/order/cart";
import { MenuGrid } from "./MenuGrid";

export function MenuBody({
  status,
  items,
  lines,
  searching,
  onPick,
  onRetry,
}: Readonly<{
  status: "pending" | "error" | "success";
  items: readonly CustomerMenuItem[];
  lines: readonly CartLine[];
  searching: boolean;
  onPick: (item: CustomerMenuItem) => void;
  onRetry: () => void;
}>) {
  if (status === "pending") {
    return (
      <div aria-busy className="grid grid-cols-2 gap-3 px-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-52 rounded-card" />
        ))}
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="px-4">
        <LoadError
          title="โหลดเมนูไม่สำเร็จ"
          description="ตรวจสัญญาณอินเทอร์เน็ตแล้วลองอีกครั้ง ตะกร้าที่เลือกไว้ยังอยู่"
          onRetry={onRetry}
        />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-text-muted">
        <PackageOpen aria-hidden className="size-8" />
        <p>{searching ? "ไม่พบเมนูที่ค้นหา" : "ยังไม่มีเมนูในหมวดนี้"}</p>
      </div>
    );
  }
  return <MenuGrid items={items} lines={lines} onPick={onPick} />;
}
