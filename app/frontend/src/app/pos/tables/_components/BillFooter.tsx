"use client";

import { Button } from "@heroui/react";
import type { Bill } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { hasMoney } from "./session-groups";

export function BillFooter({
  bill,
  locked,
  onCloseTable,
}: Readonly<{
  bill: Bill;
  locked: boolean;
  onCloseTable: () => void;
}>) {
  return (
    <footer className="flex flex-col gap-3 border-t border-line pt-4">
      <dl className="flex flex-col gap-1">
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">ยอดรวม</dt>
          <dd className="tabular-nums">{formatTHB(bill.total)}</dd>
        </div>
        {hasMoney(bill.paid) ? (
          <div className="flex justify-between gap-3">
            <dt className="text-text-muted">ชำระแล้ว</dt>
            <dd className="tabular-nums">{formatTHB(bill.paid)}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-text-muted">คงเหลือ</dt>
          <dd className="text-pos-total text-text-accent tabular-nums">{formatTHB(bill.remaining)}</dd>
        </div>
      </dl>
      <Button variant="ghost" isDisabled={locked} onPress={onCloseTable}>
        ปิดโต๊ะ
      </Button>
    </footer>
  );
}
