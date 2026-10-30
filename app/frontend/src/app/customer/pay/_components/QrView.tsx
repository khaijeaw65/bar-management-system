"use client";

import type { CustomerPendingPayment } from "@bar/contracts";
import { Button } from "@heroui/react";
import { BellRing } from "lucide-react";
import { formatTHB } from "@/lib/utils/format";
import { clockOf } from "../../tab/_lib/tab";
import { useNow } from "../../_hooks/useNow";
import type { usePayActions } from "../../_hooks/usePayActions";
import { clockText, secondsLeft } from "../_lib/countdown";
import { ExpiredView } from "./ExpiredView";
import { PayQrImage } from "./PayQrImage";

type Actions = ReturnType<typeof usePayActions>;

export function QrView({
  pending,
  seat,
  actions,
  onChangeMethod,
}: Readonly<{ pending: CustomerPendingPayment; seat: string; actions: Actions; onChangeMethod: () => void }>) {
  const now = useNow();
  const left = secondsLeft(pending.expiresAt, now);
  if (left === 0) return <ExpiredView onRenew={() => actions.create.mutate()} busy={actions.create.isPending} />;
  const told = actions.notified?.paymentId === pending.id ? actions.notified : null;
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <p className="text-small text-text-muted">สแกนจ่ายทั้งโต๊ะ</p>
      <p className="text-title tabular-nums">{formatTHB(pending.amount)}</p>
      <PayQrImage
        payload={pending.qrPayload}
        label={`QR พร้อมเพย์ ${formatTHB(pending.amount)} โต๊ะ ${seat}`}
        fileName={`promptpay-${seat}.png`}
      />
      <p role="timer" className="text-heading tabular-nums">
        {clockText(left)}
      </p>
      {/* Announced once a minute so a screen reader is not read every second. */}
      <p className="sr-only" aria-live="polite">
        QR จะหมดอายุในอีก {Math.ceil(left / 60)} นาที
      </p>
      <p className="text-center text-small text-text-muted">เปิดแอปธนาคาร → สแกน → เลือกรูปจากคลังภาพ</p>
      <Button
        size="lg"
        className="min-h-13 w-full"
        isDisabled={told !== null || actions.notify.isPending}
        onPress={() => actions.notify.mutate(pending.id)}
      >
        <BellRing aria-hidden size={18} />
        {told ? `แจ้งพนักงานแล้ว · ${clockOf(told.at)}` : "แจ้งโอนแล้ว"}
      </Button>
      {actions.notify.isError && !told ? (
        <p role="alert" className="text-small text-text-danger">
          แจ้งไม่สำเร็จ ลองอีกครั้ง
        </p>
      ) : null}
      {pending.mine ? (
        <Button size="lg" variant="ghost" className="min-h-13 w-full" isDisabled={actions.cancel.isPending} onPress={onChangeMethod}>
          เปลี่ยนวิธีจ่าย
        </Button>
      ) : null}
    </div>
  );
}
