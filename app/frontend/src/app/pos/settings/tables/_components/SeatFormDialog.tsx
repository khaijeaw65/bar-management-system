"use client";

import type { SeatAdmin, TableSeatKind } from "@bar/contracts";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { useState } from "react";
import { createSeat, updateSeat } from "@/lib/api/tables-admin";
import { ApiError } from "@/lib/api/errors";

export function SeatFormDialog({
  seat,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<{
  seat: SeatAdmin | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}>) {
  const [label, setLabel] = useState(seat?.label ?? "");
  const [kind, setKind] = useState<TableSeatKind>(seat?.kind ?? "table");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = seat !== null;
  const title = isEdit ? `แก้ไข ${seat.label}` : "เพิ่มที่นั่ง";

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      setLabelError("ต้องระบุชื่อโต๊ะ");
      return;
    }
    if (trimmed.length > 20) {
      setLabelError("ชื่อโต๊ะยาวเกินไป");
      return;
    }

    setSaving(true);
    setLabelError(null);
    try {
      if (isEdit) {
        await updateSeat(seat.id, { label: trimmed, kind });
        toast.success(`บันทึก ${trimmed} แล้ว`);
      } else {
        await createSeat({ label: trimmed, kind });
        toast.success(`เพิ่มที่นั่ง ${trimmed} แล้ว`);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.code === "SEAT_LABEL_TAKEN") {
        setLabelError("มีชื่อนี้แล้ว");
      } else if (err instanceof ApiError) {
        toast.danger(typeof err.message === "string" ? err.message : "บันทึกไม่สำเร็จ");
      } else {
        toast.danger("บันทึกไม่สำเร็จ ลองอีกครั้ง");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="sm">
        <Modal.Dialog aria-label={title}>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">{title}</Modal.Heading>

            <TextField
              value={label}
              onChange={(val) => {
                setLabel(val);
                if (labelError) setLabelError(null);
              }}
              isInvalid={labelError !== null}
            >
              <Label>ชื่อโต๊ะ</Label>
              <Input
                autoFocus
                className="min-h-11"
                placeholder="เช่น T7 หรือ C5"
                disabled={saving}
              />
              {labelError ? <FieldError>{labelError}</FieldError> : null}
            </TextField>

            <div role="radiogroup" aria-label="ประเภทที่นั่ง" className="flex flex-col gap-2">
              <span className="text-label text-text-muted">ประเภท</span>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-btn border border-line-hairline bg-surface px-4 py-2 hover:bg-surface-hover">
                  <input
                    type="radio"
                    name="seat-kind"
                    value="table"
                    checked={kind === "table"}
                    onChange={() => setKind("table")}
                    aria-label="โต๊ะ"
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-body font-medium">โต๊ะ</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-btn border border-line-hairline bg-surface px-4 py-2 hover:bg-surface-hover">
                  <input
                    type="radio"
                    name="seat-kind"
                    value="counter"
                    checked={kind === "counter"}
                    onChange={() => setKind("counter")}
                    aria-label="เคาน์เตอร์"
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-body font-medium">เคาน์เตอร์</span>
                </label>
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="min-h-11 flex-1"
                isDisabled={saving}
                onPress={onClose}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                size="lg"
                className="min-h-11 flex-1"
                isDisabled={label.trim() === "" || saving}
              >
                บันทึก
              </Button>
            </div>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
