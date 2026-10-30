"use client";

import type { CallStaffReason } from "@bar/contracts";
import { Button, Drawer, FieldError, Label, TextArea, TextField } from "@heroui/react";
import { BellRing, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { useCallStaff } from "../_hooks/useCallStaff";

const NOTE_MAX = 100;
const REASONS: ReadonlyArray<{ value: CallStaffReason; label: string }> = [
  { value: "bill", label: "เช็คบิล" },
  { value: "other", label: "อื่นๆ" },
];

type Call = ReturnType<typeof useCallStaff>;

function CallStatus({ call }: Readonly<{ call: Call }>) {
  if (call.outcome === "error" && !call.locked) {
    return (
      <p role="alert" className="text-small text-text-danger">
        แจ้งไม่สำเร็จ ลองอีกครั้ง
      </p>
    );
  }
  if (!call.locked) return null;
  const lead = call.outcome === "limited" ? (call.message ?? "แจ้งบ่อยเกินไป") : "แจ้งพนักงานแล้ว";
  return (
    <output className="text-small text-text-muted">
      {lead} · เรียกได้อีกครั้งใน {call.remaining} วินาที
    </output>
  );
}

function ReasonChips({ reason, onChange }: Readonly<{ reason: CallStaffReason | null; onChange: (value: CallStaffReason | null) => void }>) {
  return (
    <fieldset aria-label="เหตุผล" className="m-0 flex gap-2 border-0 p-0">
      {REASONS.map((entry) => (
        <button
          key={entry.value}
          type="button"
          aria-pressed={reason === entry.value}
          onClick={() => onChange(reason === entry.value ? null : entry.value)}
          className={cn(
            "h-11 rounded-pill border px-4 text-small",
            reason === entry.value ? "border-line-accent bg-accent-soft text-text-accent" : "border-line text-text-muted",
          )}
        >
          {entry.label}
        </button>
      ))}
    </fieldset>
  );
}

export function CallStaffSheet({ call, onClose }: Readonly<{ call: Call; onClose: () => void }>) {
  const [reason, setReason] = useState<CallStaffReason | null>(null);
  const [note, setNote] = useState("");
  const tooLong = note.length > NOTE_MAX;
  return (
    <Drawer.Backdrop isOpen onOpenChange={(open) => (open ? undefined : onClose())}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog>
          <Drawer.Header className="flex flex-row items-center justify-between gap-2">
            <Drawer.Heading>เรียกพนักงาน</Drawer.Heading>
            <Button isIconOnly className="size-11" variant="ghost" aria-label="ปิด" onPress={onClose}>
              <X aria-hidden size={20} />
            </Button>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            <ReasonChips reason={reason} onChange={setReason} />
            {reason === "other" ? (
              <TextField value={note} isInvalid={tooLong} onChange={setNote}>
                <Label>บอกพนักงานสั้นๆ</Label>
                <TextArea placeholder="เช่น ขอน้ำแข็งเพิ่ม" />
                {tooLong ? <FieldError>ไม่เกิน {NOTE_MAX} ตัวอักษร</FieldError> : null}
              </TextField>
            ) : null}
            <CallStatus call={call} />
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              size="lg"
              className="min-h-13 w-full"
              isDisabled={call.locked || call.pending || tooLong}
              onPress={() => call.send(reason, reason === "other" ? note.trim() : "")}
            >
              <BellRing aria-hidden size={18} />
              {call.locked ? `รอ ${call.remaining} วินาที` : "ส่ง"}
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
