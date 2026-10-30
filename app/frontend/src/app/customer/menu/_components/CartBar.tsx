"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { previewOf, type CartLine } from "@/lib/order/cart";
import { formatTHB } from "@/lib/utils/format";

export function CartBar({ lines }: Readonly<{ lines: readonly CartLine[] }>) {
  const router = useRouter();
  const { count, total } = previewOf(lines);
  if (lines.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center gap-3 border-t border-line-hairline bg-surface-bar p-4 backdrop-blur-(--blur-bar)">
      <div className="flex flex-1 flex-col">
        <span className="text-body-strong text-text-body">ตะกร้า {count} รายการ</span>
        <span className="text-small text-text-muted tabular-nums">{formatTHB(total)}</span>
      </div>
      <Button size="lg" className="min-h-13" onPress={() => router.push("/customer/cart")}>
        ดูตะกร้า
      </Button>
    </div>
  );
}
