import { DoorClosed } from "lucide-react";

export function GuestClosed() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg-app p-6 text-center">
      <DoorClosed aria-hidden className="size-10 text-text-faint" />
      <h1 className="text-heading text-text-body">โต๊ะนี้ปิดแล้ว ขอบคุณที่มาใช้บริการ</h1>
      <p className="text-small text-text-muted">สแกน QR ที่โต๊ะเพื่อเริ่มใหม่</p>
    </main>
  );
}
