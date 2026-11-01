"use client";

import {
  Alert,
  Button,
  FieldError,
  Label,
  ListBox,
  Modal,
  Radio,
  RadioGroup,
  Select,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import type { OrderLine } from "@bar/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMyPermissions, MY_PERMISSIONS_KEY } from "@/lib/api/permissions";
import { ApiError } from "@/lib/api/errors";
import {
  ADJUSTMENT_REASONS,
  compOrderItem,
  voidOrderItem,
  type AdjustmentReason,
} from "@/lib/api/void-comp";
import { formatTHB } from "@/lib/utils/format";
import { PinPadInput } from "./PinPadInput";

export interface VoidCompModalProps {
  line: OrderLine | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: OrderLine) => void;
}

export function VoidCompModal({
  line,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<VoidCompModalProps>) {
  const [actionType, setActionType] = useState<"void" | "comp">("void");
  const [reason, setReason] = useState<AdjustmentReason | "">("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const permissions = useQuery({
    queryKey: MY_PERMISSIONS_KEY,
    queryFn: getMyPermissions,
  });

  const isManagerOrOwner = Boolean(
    permissions.data?.groups.some((g) => g.name === "เจ้าของ" || g.name === "ผู้จัดการ") ||
      permissions.data?.permissions.includes("staff:manage"),
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!line) throw new Error("No line selected");
      const payload = {
        reason: reason as AdjustmentReason,
        note: note.trim() || undefined,
        pin: isManagerOrOwner ? undefined : pin,
      };
      if (actionType === "void") {
        return await voidOrderItem(line.id, payload);
      }
      return await compOrderItem(line.id, payload);
    },
    onSuccess: (updated) => {
      const msg = actionType === "void" ? `ยกเลิก ${line?.name} แล้ว` : `Comp ${line?.name} แล้ว`;
      toast.success(msg);
      onSuccess(updated);
      handleDismiss();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.status === 422 || err.code === "PIN_INVALID") {
          setPinError("PIN ไม่ถูกต้อง");
          return;
        }
        if (err.status === 429 || err.code === "PIN_LOCKED") {
          setPinError("PIN ถูกล็อค กรุณารอ 5 นาที");
          return;
        }
        if (err.status === 409 || err.code === "PAYMENT_IN_FLIGHT") {
          toast.danger("มีการชำระเงินค้างอยู่ ยกเลิก/Comp ไม่ได้");
          return;
        }
        if (err.status === 409 || err.code === "VISIT_PAID") {
          toast.danger("ชำระเงินแล้ว ยกเลิก/Comp ไม่ได้");
          return;
        }
      }
      toast.danger("ทำรายการไม่สำเร็จ — ลองอีกครั้ง");
    },
  });

  const handleDismiss = () => {
    setActionType("void");
    setReason("");
    setNote("");
    setPin("");
    setPinError(null);
    onClose();
  };

  const isOtherMissingNote = reason === "other" && !note.trim();
  const isPinMissing = !isManagerOrOwner && pin.length !== 4;
  const canSubmit = Boolean(reason) && !isOtherMissingNote && !isPinMissing && !mutation.isPending;

  if (!line) return null;

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleDismiss();
      }}
    >
      <Modal.Container size="md">
        <Modal.Dialog aria-label="ยกเลิกรายการ / Comp">
          <Modal.Heading className="text-heading">ยกเลิกรายการ / Comp</Modal.Heading>

          {/* Item details */}
          <div className="flex items-center justify-between rounded-card bg-surface-raised p-3">
            <div>
              <p className="text-body-md font-medium">{line.name}</p>
              {line.variantName && line.variantName !== "ปกติ" ? (
                <p className="text-small text-text-muted">{line.variantName}</p>
              ) : null}
            </div>
            <span className="text-price tabular-nums">{formatTHB(line.lineTotal)}</span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Action Selector */}
            <RadioGroup
              aria-label="ประเภทการปรับยอด"
              value={actionType}
              onChange={(val) => setActionType(val as "void" | "comp")}
              className="flex gap-4"
            >
              <Radio value="void" aria-label="ยกเลิก">
                <Radio.Content>
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  ยกเลิก
                </Radio.Content>
              </Radio>
              <Radio value="comp" aria-label="Comp ฟรี">
                <Radio.Content>
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  Comp ฟรี
                </Radio.Content>
              </Radio>
            </RadioGroup>

            {/* Reason Selector */}
            <Select
              aria-label="เหตุผล"
              placeholder="เลือกเหตุผล"
              selectedKey={reason || null}
              onSelectionChange={(key) => {
                if (key) setReason(String(key) as AdjustmentReason);
              }}
            >
              <Label>เหตุผล</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <ListBox.Item key={r.value} id={r.value} textValue={r.label}>
                      {r.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            {/* Note input if other */}
            {reason === "other" ? (
              <TextField
                value={note}
                onChange={setNote}
                isInvalid={isOtherMissingNote}
              >
                <Label>หมายเหตุ (จำเป็น)</Label>
                <TextArea
                  placeholder="ระบุเหตุผลเพิ่มเติม (สูงสุด 100 ตัวอักษร)"
                  maxLength={100}
                />
                {isOtherMissingNote ? (
                  <FieldError>กรุณาระบุเหตุผลเพิ่มเติม</FieldError>
                ) : null}
              </TextField>
            ) : null}

            {/* Self-approval or PIN pad */}
            {isManagerOrOwner ? (
              <Alert status="accent" role="status">
                <Alert.Content>
                  <Alert.Title>อนุมัติด้วยตนเอง</Alert.Title>
                  <Alert.Description>
                    อนุมัติด้วยตนเอง — บันทึกให้เจ้าของตรวจสอบ
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-small text-text-muted">ใส่ PIN ผู้จัดการ 4 หลักเพื่อยืนยัน</p>
                <PinPadInput
                  value={pin}
                  onChange={(val) => {
                    setPin(val);
                    setPinError(null);
                  }}
                  error={pinError}
                  disabled={mutation.isPending}
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              isDisabled={mutation.isPending}
              onPress={handleDismiss}
            >
              ปิด
            </Button>
            <Button
              variant={actionType === "void" ? "danger" : "primary"}
              className="flex-1"
              isDisabled={!canSubmit}
              isPending={mutation.isPending}
              onPress={() => mutation.mutate()}
            >
              {actionType === "void" ? "ยืนยันการยกเลิก" : "ยืนยัน Comp"}
            </Button>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
