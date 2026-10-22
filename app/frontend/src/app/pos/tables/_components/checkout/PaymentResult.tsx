"use client";

import { Button, Chip } from "@heroui/react";
import type { Payment } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";

export function PaymentResult({ payment, onSummary }: Readonly<{ payment: Payment; onSummary: () => void }>) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h2 className="text-heading">ชำระแล้ว {formatTHB(payment.amount)}</h2>
      {payment.confirmedVia === "manual" ? <Chip size="sm" color="warning" variant="soft">ยืนยันด้วยตนเอง</Chip> : null}
      <Button onPress={onSummary}>ไปที่สรุป</Button>
    </div>
  );
}
