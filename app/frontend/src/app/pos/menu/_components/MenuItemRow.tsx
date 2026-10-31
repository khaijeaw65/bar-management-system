"use client";

import type { MenuItem } from "@bar/contracts";
import { Chip, Label, Switch, Table } from "@heroui/react";
import { ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatTHB } from "@/lib/utils/format";
import { lowestMoney } from "@/lib/utils/money";
import type { SyntheticEvent } from "react";
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

// The row opens the editor on press (onAction); the Switch inside must not. React Aria rows listen to
// pointer / mouse / click / key events, so they all stop here — the hidden input alone is not enough.
const stop = (event: SyntheticEvent) => event.stopPropagation();

function stationLabel(item: MenuItem): string {
  if (item.station === null) return "ไม่ส่งสถานี";
  return item.station === "bar" ? "บาร์" : "ครัว";
}

export function MenuItemRow({
  item,
  categoryName,
  categoryHidden,
  highlighted,
  canWrite,
  canToggle,
  onImageError,
}: Readonly<{
  item: MenuItem;
  categoryName: string;
  categoryHidden: boolean;
  highlighted: boolean;
  canWrite: boolean;
  canToggle: boolean;
  onImageError: () => void;
}>) {
  const router = useRouter();
  const toggle = useAvailabilityToggle(item);
  const label = statusLabel(item);

  return (
    <Table.Row
      id={item.id}
      className={highlighted ? "bg-accent-soft" : undefined}
      onAction={canWrite ? () => router.push(`/pos/menu/${item.id}`) : undefined}
    >
      <Table.Cell className={item.unavailableReason === "sold_out" ? "text-text-faint line-through" : undefined}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-card bg-surface-input text-text-faint">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
              <img src={item.imageUrl} alt="" className="size-full object-cover" onError={onImageError} />
            ) : (
              <ImageIcon aria-hidden className="size-5" />
            )}
          </div>
          <span>{item.name}</span>
        </div>
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
          {canToggle ? (
            <div
              role="presentation"
              onPointerDown={stop}
              onPointerUp={stop}
              onMouseDown={stop}
              onMouseUp={stop}
              onClick={(event) => {
                event.stopPropagation();
                // HeroUI's visible control sits outside the label, so a click on it reaches nothing but the row.
                const onControl = (event.target as Element).closest('[data-slot="switch-control"]') !== null;
                if (onControl && !toggle.pending) toggle.toggle(!toggle.available);
              }}
              onKeyDown={stop}
              onKeyUp={stop}
            >
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
            </div>
          ) : null}
          <Chip size="sm" className={toneOf(label)}>
            {label}
          </Chip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
