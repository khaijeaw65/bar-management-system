"use client";

import type { PromptpayIdType } from "@bar/contracts";
import { Alert, Button, FieldError, Input, Label, ListBox, Select, TextField, toast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { updatePaymentSettings } from "@/lib/api/venue";

export const PROMPTPAY_TYPE_LABEL: Record<PromptpayIdType, string> = {
  mobile: "มือถือ",
  national_id: "เลขบัตรประชาชน",
  ewallet: "e-Wallet",
};

function failureOf(error: Error | null): { field: string | null; alert: string | null } {
  if (!(error instanceof ApiError)) return { field: null, alert: error ? "บันทึกไม่สำเร็จ ลองอีกครั้ง" : null };
  if (error.code === "PAYMENT_IN_FLIGHT") return { field: null, alert: "มี QR รอชำระอยู่ — ปิดหรือยกเลิกก่อนเปลี่ยนบัญชี" };
  if (error.code === "VALIDATION_ERROR") return { field: error.message, alert: null };
  return { field: null, alert: "บันทึกไม่สำเร็จ ลองอีกครั้ง" };
}

export function PromptPayForm({ onDone }: Readonly<{ onDone: () => void }>) {
  const client = useQueryClient();
  const [type, setType] = useState<PromptpayIdType>("mobile");
  const [id, setId] = useState("");
  const mutation = useMutation({
    mutationFn: updatePaymentSettings,
    onSuccess: (next) => {
      client.setQueryData(["venue", "payment-settings"], next);
      toast.success("บันทึกแล้ว");
      onDone();
    },
  });
  const failure = failureOf(mutation.error);

  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface-input p-4">
      {failure.alert ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Description>{failure.alert}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Select selectedKey={type} onSelectionChange={(key) => { setType(key as PromptpayIdType); mutation.reset(); }}>
        <Label>ประเภทบัญชี</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {(Object.keys(PROMPTPAY_TYPE_LABEL) as PromptpayIdType[]).map((key) => (
              <ListBox.Item key={key} id={key} textValue={PROMPTPAY_TYPE_LABEL[key]}>
                {PROMPTPAY_TYPE_LABEL[key]}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <TextField value={id} isInvalid={failure.field !== null} onChange={(value) => { setId(value); mutation.reset(); }}>
        <Label>หมายเลขพร้อมเพย์</Label>
        <Input inputMode="numeric" autoComplete="off" />
        {failure.field ? <FieldError>{failure.field}</FieldError> : null}
      </TextField>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onPress={onDone}>
          ยกเลิก
        </Button>
        <Button
          isPending={mutation.isPending}
          isDisabled={id.trim() === ""}
          onPress={() => mutation.mutate({ promptpayId: id, promptpayIdType: type })}
        >
          บันทึกบัญชี
        </Button>
      </div>
    </div>
  );
}
