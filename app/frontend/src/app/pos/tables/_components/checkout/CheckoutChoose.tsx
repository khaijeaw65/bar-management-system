"use client";

import { Button } from "@heroui/react";
import type { PaymentMethod, VisitDetail } from "@bar/contracts";
import { CashPanel } from "./CashPanel";
import { CheckoutNotice } from "./CheckoutNotice";
import { CheckoutSummary } from "./CheckoutSummary";
import { MethodCards } from "./MethodCards";
import { cashShort } from "./payment";
import type { CheckoutFault } from "./useCheckout";

export function CheckoutChoose({
  visit,
  method,
  received,
  fault,
  pending,
  onMethod,
  onReceived,
  onSubmit,
  onClose,
}: Readonly<{
  visit: VisitDetail;
  method: PaymentMethod;
  received: string;
  fault: CheckoutFault;
  pending: boolean;
  onMethod: (method: PaymentMethod) => void;
  onReceived: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}>) {
  const blocked = method === "cash" && cashShort(received, visit.bill.remaining);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-heading">ชำระเงิน — {visit.seatLabel}</h2>
      <CheckoutSummary visit={visit} />
      <MethodCards method={method} onChange={onMethod} />
      {method === "cash" ? <CashPanel remaining={visit.bill.remaining} received={received} onChange={onReceived} /> : null}
      <CheckoutNotice fault={fault} />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onPress={onClose}>ยกเลิก</Button>
        <Button className="flex-1" size="lg" isDisabled={blocked} isPending={pending} onPress={onSubmit}>
          {method === "cash" ? "รับเงินสด" : "สร้าง QR"}
        </Button>
      </div>
    </div>
  );
}
