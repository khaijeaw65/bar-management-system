"use client";

import { Button, Chip } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatTHB } from "@/lib/utils/format";
import { scaleMoney } from "@/lib/utils/money";
import type { CartLine } from "@/lib/order/cart";
import { QtyStepper } from "./QtyStepper";

function reasonLabel(reason: CartLine["unavailable"]): string {
  return reason === "out_of_window" ? "หมดเวลาโปร" : "หมด";
}

export function CartLineRow({
  line,
  locked,
  onQty,
  onRemove,
}: Readonly<{
  line: CartLine;
  locked: boolean;
  onQty: (quantity: number) => void;
  onRemove: () => void;
}>) {
  const blocked = line.unavailable !== null;
  const detail = [line.variantName, line.modifierLabel].filter((part) => part.length > 0).join(" · ");

  return (
    <li className={cn("flex flex-col gap-2 border-b border-line-hairline py-3", blocked && "rounded-card bg-status-void-bg px-3")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn(blocked && "line-through")}>{line.itemName}</p>
          {detail ? <p className="text-small text-text-muted">{detail}</p> : null}
          {line.orderedByName ? <p className="text-small text-text-muted">สั่งโดย {line.orderedByName}</p> : null}
          {line.notes ? <p className="text-small text-text-muted">หมายเหตุ: {line.notes}</p> : null}
        </div>
        <span className={cn("text-price tabular-nums", blocked && "line-through")}>
          {formatTHB(scaleMoney(line.unitPrice, line.quantity))}
        </span>
      </div>
      {blocked ? (
        <Chip size="sm" color="danger" variant="soft">
          {reasonLabel(line.unavailable)}
        </Chip>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <QtyStepper value={line.quantity} disabled={locked || blocked} onChange={onQty} />
        <Button isIconOnly className="size-11" size="sm" variant="ghost" aria-label={`ลบรายการ ${line.itemName}`} isDisabled={locked} onPress={onRemove}>
          <X aria-hidden size={16} />
        </Button>
      </div>
    </li>
  );
}
