import { QrCode } from "lucide-react";

export function GuestExpired() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg-app p-6 text-center">
      <QrCode aria-hidden className="size-10 text-text-faint" />
      <h1 className="text-heading text-text-body">เซสชันหมดอายุ</h1>
      <p role="alert" className="text-small text-text-muted">
        เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง
      </p>
    </main>
  );
}
