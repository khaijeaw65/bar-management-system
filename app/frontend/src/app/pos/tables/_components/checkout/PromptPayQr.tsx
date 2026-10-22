import { QRCodeSVG } from "qrcode.react";

export function PromptPayQr({ payload }: Readonly<{ payload: string }>) {
  return (
    <div className="inline-flex border-2 border-line-accent bg-qr-bg p-2 text-qr-ink">
      <QRCodeSVG
        value={payload}
        size={240}
        marginSize={4}
        bgColor="var(--qr-bg)"
        fgColor="var(--qr-ink)"
        role="img"
        aria-label="พร้อมเพย์"
      />
    </div>
  );
}
