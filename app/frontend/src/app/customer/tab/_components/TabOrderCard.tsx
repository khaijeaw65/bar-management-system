import type { CustomerTabOrder } from "@bar/contracts";
import { clockOf } from "../_lib/tab";
import { TabLineRow } from "./TabLineRow";
import { TicketChips } from "./TicketChips";

export function TabOrderCard({ order }: Readonly<{ order: CustomerTabOrder }>) {
  return (
    <li className="flex flex-col gap-2 rounded-card border border-line-hairline bg-surface-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-body-strong">#{String(order.orderNumber).padStart(3, "0")}</span>
        <span className="text-small text-text-muted tabular-nums">{clockOf(order.placedAt)}</span>
      </div>
      <TicketChips tickets={order.tickets} />
      <ul className="divide-y divide-line-hairline">
        {order.lines.map((line, index) => (
          <TabLineRow key={`${line.itemName}-${index}`} line={line} />
        ))}
      </ul>
    </li>
  );
}
