"use client";

import { Chip, Label, Radio, RadioGroup } from "@heroui/react";
import type { PaymentMethod } from "@bar/contracts";

export function MethodCards({
  method,
  onChange,
}: Readonly<{
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}>) {
  return (
    <RadioGroup aria-label="วิธีชำระ" value={method} onChange={(value) => onChange(value === "cash" ? "cash" : "promptpay")}>
      <Radio value="promptpay">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Label>PromptPay QR</Label>
          <Chip size="sm" color="warning" variant="soft">ยืนยันด้วยตนเอง</Chip>
        </Radio.Content>
      </Radio>
      <Radio value="cash">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Label>เงินสด</Label>
        </Radio.Content>
      </Radio>
    </RadioGroup>
  );
}
