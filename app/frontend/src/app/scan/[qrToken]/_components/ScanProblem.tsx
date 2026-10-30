"use client";

import { Button } from "@heroui/react";
import { QrCode } from "lucide-react";
import { ApiError } from "@/lib/api/errors";

export function ScanProblem({ error, onRetry }: Readonly<{ error: unknown; onRetry: () => void }>) {
  const invalid = error instanceof ApiError && error.code === "QR_INVALID";
  const busy = error instanceof ApiError && error.status === 429;
  let title = "เปิดเมนูไม่สำเร็จ";
  if (invalid) title = "QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน";
  else if (busy) title = "มีคนสแกนพร้อมกันมาก";
  const detail = invalid
    ? "QR นี้อาจถูกเปลี่ยนแล้ว หรือโต๊ะยังไม่พร้อม — ขอ QR ใหม่จากพนักงานที่บาร์"
    : "ตรวจสัญญาณอินเทอร์เน็ตแล้วลองอีกครั้ง";
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg-app p-6 text-center">
      <QrCode aria-hidden className="size-10 text-text-faint" />
      <h1 role="alert" className="text-heading text-text-body">{title}</h1>
      <p className="text-small text-text-muted">{detail}</p>
      {invalid ? null : (
        <Button size="lg" variant="secondary" onPress={onRetry}>
          ลองอีกครั้ง
        </Button>
      )}
    </main>
  );
}
