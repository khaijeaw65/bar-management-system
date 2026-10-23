"use client";

import type { MenuItem } from "@bar/contracts";
import { Chip, Label, Switch, Table } from "@heroui/react";
import { useRouter } from "next/navigation";
import { formatTHB } from "@/lib/utils/format";
import { lowestMoney } from "@/lib/utils/money";
import { useAvailabilityToggle } from "../_hooks/useAvailabilityToggle";

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

function toneOf(label: string): string {
  if (label === "หมด") return "bg-status-void-bg text-status-void-fg";
  if (label === "นอกเวลาโปร") return "bg-warning-bg text-warning-fg";
  return "bg-status-served-bg text-status-served-fg";
}

function stationLabel(item: MenuItem): string {
  if (item.station === null) return "ไม่ส่งสถานี";
  return item.station === "bar" ? "บาร์" : "ครัว";
}

export function MenuItemRow({
  item,
  categoryName,
  categoryHidden,
  highlighted,
}: Readonly<{ item: MenuItem; categoryName: string; categoryHidden: boolean; highlighted: boolean }>) {
  const router = useRouter();
  const toggle = useAvailabilityToggle(item);
  const label = statusLabel(item);

  return (
    <Table.Row
      id={item.id}
      className={highlighted ? "bg-accent-soft" : undefined}
      onAction={() => router.push(`/pos/menu/${item.id}`)}
    >
      <Table.Cell className={item.unavailableReason === "sold_out" ? "text-text-faint line-through" : undefined}>
        {item.name}
        {item.isPromo ? <Chip size="sm" className="ml-2">โปร</Chip> : null}
      </Table.Cell>
      <Table.Cell className="text-text-muted">
        {categoryName}
        {categoryHidden ? <Chip size="sm" className="ml-2">ซ่อนอยู่</Chip> : null}
      </Table.Cell>
      <Table.Cell className="text-text-muted">{stationLabel(item)}</Table.Cell>
      <Table.Cell className="text-text-accent tabular-nums">{priceLabel(item)}</Table.Cell>
      <Table.Cell>
        <div className="flex items-center gap-3">
          <Switch
            isSelected={toggle.available}
            isDisabled={toggle.pending}
            onChange={toggle.toggle}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label className="sr-only">พร้อมขาย {item.name}</Label>
            </Switch.Content>
          </Switch>
          <Chip size="sm" className={toneOf(label)}>
            {label}
          </Chip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
