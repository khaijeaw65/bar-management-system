"use client";

import { Button } from "@heroui/react";
import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  disabled,
  onChange,
}: Readonly<{
  value: number;
  disabled?: boolean;
  onChange: (quantity: number) => void;
}>) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="จำนวน">
      <Button isIconOnly className="size-11" size="sm" variant="secondary" aria-label="ลด" isDisabled={disabled || value <= 1} onPress={() => onChange(value - 1)}>
        <Minus aria-hidden size={16} />
      </Button>
      <span className="min-w-8 text-center tabular-nums">{value}</span>
      <Button isIconOnly className="size-11" size="sm" variant="secondary" aria-label="เพิ่ม" isDisabled={disabled || value >= 99} onPress={() => onChange(value + 1)}>
        <Plus aria-hidden size={16} />
      </Button>
    </div>
  );
}
