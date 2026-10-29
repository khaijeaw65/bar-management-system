"use client";

import { Alert, Button, Chip } from "@heroui/react";
import type { Payment } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { useState } from "react";
import { CheckoutNotice } from "./CheckoutNotice";
import { PromptPayQr } from "./PromptPayQr";
import { SlipScanner } from "./SlipScanner";
import { useQrClock } from "./useQrClock";
import type { CheckoutFault } from "./useCheckout";

function LiveQr({
  payment,
  socketDown,
  pending,
  fault,
  onCancel,
  onScan,
  onManual,
}: Readonly<{
  payment: Payment;
  socketDown: boolean;
  pending: boolean;
  fault: CheckoutFault;
  onCancel: () => void;
  onScan: () => void;
  onManual: () => void;
}>) {
  const { clock, minute } = useQrClock(payment.expiresAt);
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Chip size="sm" color="warning" variant="soft">รอชำระ</Chip>
        <p className="text-pos-total tabular-nums">{formatTHB(payment.amount)}</p>
      </div>
      {payment.qrPayload ? <PromptPayQr payload={payment.qrPayload} /> : null}
      <p aria-hidden="true">หมดเวลาใน {clock}</p>
      <p className="sr-only" aria-live="polite">เหลือ {minute} นาที</p>
      {socketDown ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Description>การเชื่อมต่อขาด กำลังตรวจสอบสถานะ…</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <CheckoutNotice fault={fault} />
      <Button onPress={onScan}>สแกนสลิป</Button>
      <Button variant="ghost" onPress={onManual}>ยืนยันด้วยตนเอง</Button>
      <Button variant="secondary" isPending={pending} onPress={onCancel}>ยกเลิก QR</Button>
    </>
  );
}

function ExpiredQr({ payment, pending, onNew }: Readonly<{ payment: Payment; pending: boolean; onNew: () => void }>) {
  return (
    <>
      <p>QR หมดเวลา</p>
      <p className="text-small text-text-muted">ยังไม่มียอดเข้า สร้าง QR ใหม่เพื่อให้ลูกค้าสแกนอีกครั้ง</p>
      {payment.qrPayload ? <div className="opacity-40"><PromptPayQr payload={payment.qrPayload} /></div> : null}
      <Button size="lg" isPending={pending} onPress={onNew}>สร้าง QR ใหม่</Button>
    </>
  );
}

export function PromptPayPending({
  payment,
  socketDown,
  pending,
  expired,
  fault,
  onCancel,
  onManual,
  onNew,
  onVerified,
}: Readonly<{
  payment: Payment;
  socketDown: boolean;
  pending: boolean;
  expired: boolean;
  fault: CheckoutFault;
  onCancel: () => void;
  onManual: () => void;
  onNew: () => void;
  onVerified: (payment: Payment) => void;
}>) {
  const [scanning, setScanning] = useState(false);
  return (
    <div className="flex flex-col items-start gap-4">
      {scanning && !expired ? (
        <SlipScanner payment={payment} onVerified={onVerified} onManual={onManual} />
      ) : (
        <>
          <h2 className="text-heading">PromptPay QR</h2>
          {expired ? <ExpiredQr payment={payment} pending={pending} onNew={onNew} /> : (
            <LiveQr
              payment={payment}
              socketDown={socketDown}
              pending={pending}
              fault={fault}
              onCancel={onCancel}
              onScan={() => setScanning(true)}
              onManual={onManual}
            />
          )}
        </>
      )}
    </div>
  );
}
