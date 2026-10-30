"use client";

import { Button } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";

export function CartFooter({
  total,
  pending,
  blocked,
  onSend,
}: Readonly<{ total: string; pending: boolean; blocked: boolean; onSend: () => void }>) {
  return (
    <div className="sticky bottom-0 flex flex-col gap-3 border-t border-line-hairline bg-surface-bar p-4 backdrop-blur-(--blur-bar)">
      <div className="flex items-baseline justify-between">
        <span className="text-small text-text-muted">รวม</span>
        <span className="text-title tabular-nums">{formatTHB(total)}</span>
      </div>
      <Button size="lg" className="min-h-13 w-full" isPending={pending} isDisabled={blocked || pending} onPress={onSend}>
        {pending ? "กำลังส่ง…" : "สั่งเลย"}
      </Button>
    </div>
  );
}
