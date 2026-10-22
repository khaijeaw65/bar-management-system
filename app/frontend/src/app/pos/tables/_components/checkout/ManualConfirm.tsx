"use client";

import { Alert, Button, FieldError, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import type { ManualConfirmReason } from "@bar/contracts";
import { CheckoutNotice } from "./CheckoutNotice";
import { canConfirm } from "./payment";
import type { CheckoutFault } from "./useCheckout";

const reasons = [
  ["direct_transfer", "ลูกค้าโอนเข้าบัญชีร้านโดยตรง"],
  ["webhook_missing", "ระบบไม่ได้รับการยืนยัน"],
  ["other", "อื่นๆ"],
] as const;

export function ManualConfirm({
  reason,
  note,
  fault,
  pending,
  onReason,
  onNote,
  onConfirm,
  onClose,
}: Readonly<{
  reason: ManualConfirmReason | "";
  note: string;
  fault: CheckoutFault;
  pending: boolean;
  onReason: (reason: ManualConfirmReason) => void;
  onNote: (note: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}>) {
  const ready = canConfirm(reason, note);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-heading">ยืนยันด้วยตนเอง</h2>
      <Alert status="warning">
        <Alert.Content>
          <Alert.Description>ใช้เมื่อระบบไม่ได้รับการยืนยันจากธนาคาร — จะถูกบันทึกให้เจ้าของตรวจสอบ</Alert.Description>
        </Alert.Content>
      </Alert>
      <Select
        aria-label="เหตุผล"
        placeholder="เลือกเหตุผล"
        selectedKey={reason || null}
        onSelectionChange={(key) => {
          if (key === "direct_transfer" || key === "webhook_missing" || key === "other") onReason(key);
        }}
      >
        <Label>เหตุผล</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {reasons.map(([id, label]) => (
              <ListBox.Item key={id} id={id} textValue={label}>{label}</ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {reason === "other" ? (
        <TextField value={note} isInvalid={note.length > 500} onChange={onNote}>
          <Label>หมายเหตุ</Label>
          <TextArea />
          {note.length > 500 ? <FieldError>หมายเหตุยาวเกินไป</FieldError> : null}
        </TextField>
      ) : null}
      <CheckoutNotice fault={fault} />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onPress={onClose}>ปิด</Button>
        <Button className="flex-1" isDisabled={!ready} isPending={pending} onPress={onConfirm}>ยืนยันว่าชำระแล้ว</Button>
      </div>
    </div>
  );
}
