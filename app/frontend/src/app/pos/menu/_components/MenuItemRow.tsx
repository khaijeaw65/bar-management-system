import { Chip, Table } from "@heroui/react";
import type { MenuItem } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { lowestMoney } from "@/lib/utils/money";

function priceLabel(item: MenuItem): string {
  const prices = item.variants.map((variant) => variant.price);
  if (new Set(prices).size < 2) return formatTHB(item.basePrice);
  return `เริ่ม ${formatTHB(lowestMoney(prices))}`;
}

function statusLabel(item: MenuItem): string {
  if (item.unavailableReason === "sold_out") return "หมด";
  if (item.unavailableReason === "out_of_window") return "นอกเวลาโปร";
  return "พร้อมขาย";
}

export function MenuItemRow({
  item,
  categoryName,
}: Readonly<{ item: MenuItem; categoryName: string }>) {
  const label = statusLabel(item);
  const soldOut = item.unavailableReason === "sold_out";
  const tone =
    label === "หมด"
      ? "bg-status-void-bg text-status-void-fg"
      : label === "นอกเวลาโปร"
        ? "bg-warning-bg text-warning-fg"
        : "bg-status-served-bg text-status-served-fg";

  return (
    <Table.Row id={item.id}>
      <Table.Cell className={soldOut ? "text-text-faint line-through" : undefined}>{item.name}</Table.Cell>
      <Table.Cell className="text-text-muted">{categoryName}</Table.Cell>
      <Table.Cell className="text-text-accent tabular-nums">{priceLabel(item)}</Table.Cell>
      <Table.Cell>
        <Chip size="sm" className={tone}>
          {label}
        </Chip>
      </Table.Cell>
    </Table.Row>
  );
}
