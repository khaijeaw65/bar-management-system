"use client";

import { Button, Chip, Label, Radio, RadioGroup, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { getPaymentSettings } from "@/lib/api/venue";
import { PromptPayForm, PROMPTPAY_TYPE_LABEL } from "./PromptPayForm";
import { SettingsSection } from "./SettingsSection";

export const PAYMENT_SETTINGS_KEY = ["venue", "payment-settings"] as const;

export function PaymentSection({ canEdit }: Readonly<{ canEdit: boolean }>) {
  const settings = useQuery({ queryKey: PAYMENT_SETTINGS_KEY, queryFn: getPaymentSettings, retry: false });
  const [editing, setEditing] = useState(false);

  return (
    <SettingsSection title="การชำระเงิน">
      <RadioGroup value="own_promptpay" aria-label="วิธีรับเงิน">
        <Radio value="own_promptpay" className="flex items-center gap-2.5">
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content>
            <Label>PromptPay ของร้าน</Label>
          </Radio.Content>
        </Radio>
        <Radio value="gateway" isDisabled className="flex items-center gap-2.5">
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content className="flex items-center gap-2">
            <Label>Gateway</Label>
            <Chip size="sm">เร็วๆ นี้</Chip>
          </Radio.Content>
        </Radio>
      </RadioGroup>
      {settings.isPending ? <Skeleton className="h-16 w-full rounded-card" /> : null}
      {settings.isError ? <LoadError onRetry={() => void settings.refetch()} /> : null}
      {settings.data && !editing ? (
        <div className="flex items-center justify-between gap-4 rounded-card bg-surface-input p-4">
          <div className="flex flex-col">
            <span className="text-small text-text-muted">
              บัญชีพร้อมเพย์{settings.data.promptpayIdType ? ` · ${PROMPTPAY_TYPE_LABEL[settings.data.promptpayIdType]}` : ""}
            </span>
            <span className="text-body-md font-semibold">{settings.data.promptpayIdMasked ?? "ยังไม่ได้ตั้งค่า"}</span>
          </div>
          {canEdit ? (
            <Button variant="secondary" onPress={() => setEditing(true)}>
              เปลี่ยนบัญชี
            </Button>
          ) : null}
        </div>
      ) : null}
      {settings.data && editing ? <PromptPayForm onDone={() => setEditing(false)} /> : null}
    </SettingsSection>
  );
}
