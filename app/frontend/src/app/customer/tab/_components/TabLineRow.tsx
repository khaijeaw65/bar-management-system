import type { CustomerTabLine } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { formatTHB } from "@/lib/utils/format";

export function TabLineRow({ line }: Readonly<{ line: CustomerTabLine }>) {
  const detail = [line.variantName === "ปกติ" ? null : line.variantName, ...line.modifiers].filter(Boolean).join(" · ");
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className={cn("flex min-w-0 flex-col", line.cancelled && "text-text-faint line-through")}>
        <span className="text-body">
          {line.itemName} × {line.quantity}
        </span>
        {detail ? <span className="text-small text-text-muted">{detail}</span> : null}
        {line.cancelled ? <span className="text-small text-text-muted no-underline">รายการถูกยกเลิก</span> : null}
        <span className="text-small text-text-muted">สั่งโดย {line.orderedByName ?? "ลูกค้า"}</span>
      </div>
      <span className={cn("shrink-0 text-body tabular-nums", line.cancelled && "text-text-faint line-through")}>
        {formatTHB(line.lineTotal)}
      </span>
    </li>
  );
}
