import { Button } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";
import { clockOf } from "../_lib/tab";

export function TabFooter({
  total,
  asOf,
  onOrderMore,
}: Readonly<{ total: string; asOf: string; onOrderMore: () => void }>) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto flex items-center gap-3 border-t border-line-hairline bg-surface-bar p-4 backdrop-blur-(--blur-bar)">
      <div className="flex flex-1 flex-col">
        <span className="text-small text-text-muted">รวมทั้งโต๊ะ</span>
        <span className="text-title tabular-nums">{formatTHB(total)}</span>
        <span className="text-small text-text-faint">อัปเดต {clockOf(asOf)}</span>
      </div>
      <Button size="lg" className="min-h-13" onPress={onOrderMore}>
        สั่งเพิ่ม
      </Button>
    </div>
  );
}
