"use client";

import { Button, Chip } from "@heroui/react";
import type { Payment } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { fromSatang, toSatang } from "@/lib/utils/money";

export function PaymentResult({ payment, onSummary }: Readonly<{ payment: Payment; onSummary: () => void }>) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h2 className="text-heading">ชำระแล้ว {formatTHB(payment.amount)}</h2>
      {payment.confirmedVia === "slip_verify" ? <SlipEvidence payment={payment} /> : null}
      {payment.confirmedVia === "manual" ? <Chip size="sm" color="warning" variant="soft">ยืนยันด้วยตนเอง</Chip> : null}
      <Button onPress={onSummary}>ไปที่สรุป</Button>
    </div>
  );
}

function SlipEvidence({ payment }: Readonly<{ payment: Payment }>) {
  const extra = payment.slipAmount ? toSatang(payment.slipAmount) - toSatang(payment.amount) : 0;
  return (
    <>
      <p>ยืนยันสลิปแล้ว</p>
      {payment.slipTransRef ? <p>{payment.slipTransRef}</p> : null}
      <p>{formatTHB(payment.slipAmount ?? payment.amount)}</p>
      {extra > 0 ? <p>โอนเกิน {formatTHB(fromSatang(extra))}</p> : null}
    </>
  );
}
