"use client";

import { Button } from "@heroui/react";
import { Trash2 } from "lucide-react";
import type { CartAction, CartLine } from "@/lib/order/cart";
import { formatTHB } from "@/lib/utils/format";
import { scaleMoney } from "@/lib/utils/money";
import { QtyStepper } from "../../_components/QtyStepper";

const REASON = {
  sold_out: "หมดแล้ว — ลบออกเพื่อสั่งต่อ",
  out_of_window: "หมดเวลาโปร — ลบออกเพื่อสั่งต่อ",
} as const;

export function CartLineRow({
  line,
  locked,
  dispatch,
}: Readonly<{ line: CartLine; locked: boolean; dispatch: (action: CartAction) => void }>) {
  const total = formatTHB(scaleMoney(line.unitPrice, line.quantity));
  return (
    <li className="flex flex-col gap-2 border-b border-line-hairline py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-body-strong text-text-body">{line.itemName}</span>
          {line.variantName !== "ปกติ" ? <span className="text-small text-text-muted">{line.variantName}</span> : null}
          {line.modifierLabel ? <span className="text-small text-text-muted">{line.modifierLabel}</span> : null}
          {line.notes ? <span className="text-small text-text-muted">“{line.notes}”</span> : null}
        </div>
        <span className={line.unavailable ? "text-body-strong text-text-faint line-through tabular-nums" : "text-body-strong tabular-nums"}>{total}</span>
      </div>
      {line.unavailable ? (
        <div className="flex items-center justify-between gap-2">
          <p role="alert" className="text-small text-text-danger">{REASON[line.unavailable]}</p>
          <Button variant="danger" aria-label={`ลบออก ${line.itemName}`} isDisabled={locked} onPress={() => dispatch({ type: "remove", id: line.id })}>
            ลบออก
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <QtyStepper value={line.quantity} disabled={locked} label={`จำนวน ${line.itemName}`} onChange={(quantity) => dispatch({ type: "qty", id: line.id, quantity })} />
          <Button isIconOnly variant="ghost" className="size-11" aria-label={`เอา ${line.itemName} ออก`} isDisabled={locked} onPress={() => dispatch({ type: "remove", id: line.id })}>
            <Trash2 aria-hidden size={18} />
          </Button>
        </div>
      )}
    </li>
  );
}
