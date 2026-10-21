"use client";

import { Description, Label, ListBox, Select } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";

export function SeatSelect({
  seats,
  seatId,
  onSeat,
}: Readonly<{
  seats: TableSummary[];
  seatId: string | null;
  onSeat: (seatId: string | null) => void;
}>) {
  const none = seats.length === 0;

  return (
    <Select
      placeholder={none ? "ไม่มีโต๊ะว่าง" : "เลือกโต๊ะที่ว่าง"}
      selectedKey={seatId}
      isDisabled={none}
      onSelectionChange={(key) => onSeat(key == null ? null : String(key))}
    >
      <Label>โต๊ะ / ที่นั่ง</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Description>แสดงเฉพาะโต๊ะที่ว่าง</Description>
      <Select.Popover>
        <ListBox>
          {seats.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
              {item.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
