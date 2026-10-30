import { Button } from "@heroui/react";
import { CircleCheck } from "lucide-react";

export function PaidView({ onBack }: Readonly<{ onBack: () => void }>) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <CircleCheck aria-hidden className="size-10 text-text-success" />
      <h2 className="text-heading">ชำระเรียบร้อย</h2>
      <p className="text-text-muted">ขอบคุณที่ใช้บริการ สั่งเพิ่มได้ ยอดใหม่จะนับต่างหาก</p>
      <Button size="lg" className="min-h-13 w-full" onPress={onBack}>
        กลับไปที่บิล
      </Button>
    </div>
  );
}
