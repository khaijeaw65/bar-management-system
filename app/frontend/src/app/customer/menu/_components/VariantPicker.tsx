"use client";

import { Label, Radio, RadioGroup } from "@heroui/react";
import type { MenuItemVariant } from "@bar/contracts";
import { useId } from "react";
import { formatTHB } from "@/lib/utils/format";

export function VariantPicker({
  variants,
  variantId,
  onChange,
}: Readonly<{ variants: readonly MenuItemVariant[]; variantId: string; onChange: (variantId: string) => void }>) {
  const labelId = useId();
  return (
    <RadioGroup aria-labelledby={labelId} value={variantId} onChange={onChange}>
      <Label id={labelId}>ตัวเลือก</Label>
      {variants.map((entry) => {
        const label = `${entry.name} ${formatTHB(entry.price)}`;
        return (
          <Radio key={entry.id} value={entry.id} className="min-h-11" aria-label={label} isDisabled={!entry.isAvailable}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Label>{label}</Label>
            </Radio.Content>
          </Radio>
        );
      })}
    </RadioGroup>
  );
}
