"use client";

import { Input, Label, TextField } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";
import { changeAmount } from "./payment";

export function CashPanel({
  remaining,
  received,
  onChange,
}: Readonly<{
  remaining: string;
  received: string;
  onChange: (value: string) => void;
}>) {
  const change = changeAmount(received, remaining);
  return (
    <TextField value={received} onChange={onChange}>
      <Label>รับเงินมา (ไม่บังคับ)</Label>
      <Input inputMode="decimal" />
      {change ? <p className="text-small text-text-muted">เงินทอน {formatTHB(change)}</p> : null}
    </TextField>
  );
}
