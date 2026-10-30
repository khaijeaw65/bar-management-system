"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { Button } from "@heroui/react";
import { Download } from "lucide-react";

// Plain black on white: the saved PNG is opened in a bank app's gallery picker, so it cannot depend on theme tokens.
const INK = "#000000";
const PAPER = "#ffffff";

export function PayQrImage({ payload, label, fileName }: Readonly<{ payload: string; label: string; fileName: string }>) {
  const holder = useRef<HTMLDivElement>(null);
  const save = () => {
    holder.current?.querySelector("canvas")?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={holder} className="inline-flex rounded-card border-2 border-line-accent p-1" style={{ background: PAPER }}>
        <QRCodeCanvas value={payload} size={240} marginSize={4} bgColor={PAPER} fgColor={INK} role="img" aria-label={label} />
      </div>
      <Button variant="secondary" className="min-h-11" onPress={save}>
        <Download aria-hidden size={16} />
        บันทึก QR
      </Button>
    </div>
  );
}
