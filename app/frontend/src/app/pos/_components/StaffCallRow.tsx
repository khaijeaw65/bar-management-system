"use client";

import { Button, Chip } from "@heroui/react";
import type { StaffCall } from "@bar/contracts";
import { callReasonText, formatCallAge } from "@/lib/pos/alerts";

export function StaffCallRow({
  label,
  call,
  now,
  onAcknowledge,
}: Readonly<{
  label: string;
  call: StaffCall;
  now: number | null;
  onAcknowledge: () => void;
}>) {
  const reason = callReasonText(call);
  const text = `เรียกพนักงาน${reason ? ` · ${reason}` : ""} · ${formatCallAge(call.calledAt, now)}`;

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Chip size="sm" color="warning" variant="soft">
        {text}
      </Chip>
      <Button size="sm" variant="secondary" className="min-h-11" aria-label={`รับทราบ ${label}`} onPress={onAcknowledge}>
        รับทราบ
      </Button>
    </div>
  );
}
