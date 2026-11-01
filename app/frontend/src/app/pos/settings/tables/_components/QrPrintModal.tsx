"use client";

import type { SeatAdmin } from "@bar/contracts";
import { Button, Modal, toast } from "@heroui/react";
import { Printer, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { regenerateSeatQr } from "@/lib/api/tables-admin";

export function QrPrintModal({
  seat,
  isOpen,
  onClose,
  onRegenerate,
}: Readonly<{
  seat: SeatAdmin;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (newToken: string) => void;
}>) {
  const [confirming, setConfirming] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const title = seat.kind === "counter" ? `QR เคาน์เตอร์ ${seat.label}` : `QR โต๊ะ ${seat.label}`;
  const seatDisplayName = seat.kind === "counter" ? `เคาน์เตอร์ ${seat.label}` : `โต๊ะ ${seat.label}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3010";
  const scanUrl = `${origin}/scan/${seat.qrToken ?? ""}`;

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await regenerateSeatQr(seat.id);
      toast.success("สร้าง QR ใหม่แล้ว");
      onRegenerate(res.qrToken);
      setConfirming(false);
    } catch {
      toast.danger("สร้าง QR ใหม่ไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setRegenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (!isOpen) return null;

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container size="sm">
          <Modal.Dialog aria-label={title}>
            <div className="flex flex-col items-center gap-4 text-center">
              <Modal.Heading className="text-heading">{title}</Modal.Heading>

              {/* High-contrast printable sticker container */}
              <div
                id="qr-sticker-printable"
                className="flex w-full max-w-xs flex-col items-center gap-3 rounded-card border-2 border-line-hairline bg-qr-bg p-6 text-qr-ink shadow-sm"
              >
                <span className="text-small font-semibold tracking-wider uppercase opacity-75">
                  The Loft Bar
                </span>
                <span className="text-2xl font-bold">{seatDisplayName}</span>

                <div className="rounded-card border-2 border-line-hairline bg-qr-bg p-2">
                  <QRCodeSVG
                    value={scanUrl}
                    size={200}
                    marginSize={2}
                    bgColor="var(--qr-bg)"
                    fgColor="var(--qr-ink)"
                    role="img"
                    aria-label={title}
                  />
                </div>

                <p className="text-small font-medium">สแกนเพื่อสั่งอาหารและเครื่องดื่ม</p>
              </div>

              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #qr-sticker-printable,
                  #qr-sticker-printable * {
                    visibility: visible !important;
                  }
                  #qr-sticker-printable {
                    position: fixed !important;
                    left: 50% !important;
                    top: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    border: 2px solid #000 !important;
                    box-shadow: none !important;
                  }
                }
              `}</style>

              <div className="flex w-full flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="min-h-11 flex-1"
                    onPress={onClose}
                  >
                    ปิด
                  </Button>
                  <Button
                    size="lg"
                    className="min-h-11 flex-1"
                    onPress={handlePrint}
                  >
                    <Printer size={18} aria-hidden />
                    พิมพ์
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-text-muted hover:text-text-danger"
                  onPress={() => setConfirming(true)}
                >
                  <RefreshCw size={14} aria-hidden />
                  สร้าง QR ใหม่
                </Button>
              </div>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {confirming ? (
        <Modal.Backdrop isOpen={confirming} onOpenChange={(open) => { if (!open) setConfirming(false); }}>
          <Modal.Container size="sm">
            <Modal.Dialog role="alertdialog" aria-label="ยืนยันสร้าง QR ใหม่">
              <div className="flex flex-col gap-4">
                <Modal.Heading className="text-heading">สร้าง QR ใหม่?</Modal.Heading>
                <p className="text-body text-text-muted">
                  QR เดิมจะใช้ไม่ได้ทันที ลูกค้าที่สแกน QR เดิมจะเห็น &apos;QR ไม่ถูกต้อง&apos;
                </p>
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="min-h-11 flex-1"
                    isDisabled={regenerating}
                    onPress={() => setConfirming(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="lg"
                    variant="danger-soft"
                    className="min-h-11 flex-1"
                    isDisabled={regenerating}
                    onPress={() => void handleRegenerate()}
                  >
                    ยืนยัน
                  </Button>
                </div>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      ) : null}
    </>
  );
}
