"use client";

import { Button } from "@heroui/react";
import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  min = 1,
  disabled,
  label = "จำนวน",
  onChange,
}: Readonly<{ value: number; min?: number; disabled?: boolean; label?: string; onChange: (quantity: number) => void }>) {
  return (
    <fieldset className="flex items-center gap-1 border-0 p-0" aria-label={label}>
      <Button isIconOnly className="size-11" variant="secondary" aria-label="ลด" isDisabled={disabled || value <= min} onPress={() => onChange(value - 1)}>
        <Minus aria-hidden size={18} />
      </Button>
      <span aria-live="polite" className="min-w-10 text-center text-body-strong tabular-nums">{value}</span>
      <Button isIconOnly className="size-11" variant="secondary" aria-label="เพิ่ม" isDisabled={disabled || value >= 99} onPress={() => onChange(value + 1)}>
        <Plus aria-hidden size={18} />
      </Button>
    </fieldset>
  );
}
