import { Button } from "@heroui/react";
import { TimerOff } from "lucide-react";

export function ExpiredView({ onRenew, busy }: Readonly<{ onRenew: () => void; busy: boolean }>) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <TimerOff aria-hidden className="size-10 text-text-muted" />
      <h2 className="text-heading">QR หมดอายุ</h2>
      <p className="text-text-muted">สร้าง QR ใหม่เพื่อจ่ายต่อ</p>
      <Button size="lg" className="min-h-13 w-full" isDisabled={busy} onPress={onRenew}>
        สร้าง QR ใหม่
      </Button>
    </div>
  );
}
