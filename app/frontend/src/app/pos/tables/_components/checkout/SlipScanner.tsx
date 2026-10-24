"use client";

import { Button } from "@heroui/react";
import type { Payment } from "@bar/contracts";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { verifySlip } from "@/lib/api/payments";
import { resizeSlipImage } from "./resize-slip-image";
import { SLIP_COPY } from "./slip-copy";
import { useSlipScanner } from "./useSlipScanner";

export function SlipScanner({
  payment,
  onVerified,
  onManual,
}: Readonly<{
  payment: Payment;
  onVerified: (payment: Payment) => void;
  onManual: () => void;
}>) {
  const [attempt, setAttempt] = useState(0);
  const [fault, setFault] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(body: { payload: string } | { image: string }) {
    setBusy(true);
    setFault(null);
    try {
      onVerified(await verifySlip(payment.id, body));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "SLIP_SERVICE_UNAVAILABLE";
      setFault(SLIP_COPY[code] ?? "ตรวจสลิปไม่ได้ — ลองใหม่หรือยืนยันด้วยตนเอง");
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <h2 className="text-heading">สแกนสลิป</h2>
      {busy ? <p>กำลังตรวจสลิป</p> : null}
      {fault ? <p role="alert">{fault}</p> : null}
      {fault === null && !busy ? <LiveScan key={attempt} onSubmit={(body) => void submit(body)} /> : null}
      <div className="flex flex-wrap gap-2">
        {fault ? (
          <Button
            onPress={() => {
              setFault(null);
              setAttempt((value) => value + 1);
            }}
          >
            สแกนใหม่
          </Button>
        ) : null}
        <Button variant="ghost" onPress={onManual}>ยืนยันด้วยตนเอง</Button>
      </div>
    </div>
  );
}

function LiveScan({ onSubmit }: Readonly<{ onSubmit: (body: { payload: string } | { image: string }) => void }>) {
  const { videoRef, camera, scanFault } = useSlipScanner(true, (payload) => onSubmit({ payload }));

  return (
    <>
      <video ref={videoRef} muted playsInline className={camera === "live" ? "w-full rounded-lg" : "hidden"} />
      {camera === "denied" ? <p>ใช้กล้องไม่ได้ — ถ่ายรูปหรือเลือกรูปแทน</p> : null}
      {scanFault ? <p>สแกนไม่ได้ — ถ่ายรูปหรือเลือกรูปแทน</p> : null}
      {camera === "starting" ? <p>กำลังเปิดกล้อง</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          isDisabled={camera !== "live"}
          onPress={() => {
            const video = videoRef.current;
            if (!video) return;
            void resizeSlipImage(video).then((image) => onSubmit({ image }));
          }}
        >
          ถ่ายรูปแทน
        </Button>
        <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2">
          <span>เลือกรูป</span>
          <input
            aria-label="เลือกรูป"
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void resizeSlipImage(file).then((image) => onSubmit({ image }));
            }}
          />
        </label>
      </div>
    </>
  );
}
