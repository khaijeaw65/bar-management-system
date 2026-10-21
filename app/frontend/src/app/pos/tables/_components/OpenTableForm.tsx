"use client";

import { Alert, Button, FieldError, Input, Label, Modal, TextField } from "@heroui/react";
import type { TableSummary } from "@bar/contracts";
import { SeatSelect } from "./SeatSelect";

export function OpenTableForm({
  seats,
  seatId,
  guest,
  problem,
  failed,
  pending,
  onSeat,
  onGuest,
  onClose,
  onSubmit,
}: Readonly<{
  seats: TableSummary[];
  seatId: string | null;
  guest: string;
  problem: string | null;
  failed: boolean;
  pending: boolean;
  onSeat: (seatId: string | null) => void;
  onGuest: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}>) {
  const none = seats.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <Modal.Heading className="text-heading">เปิดโต๊ะ</Modal.Heading>
      {failed ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Description>เปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <SeatSelect seats={seats} seatId={seatId} onSeat={onSeat} />
      <TextField value={guest} isInvalid={problem !== null} onChange={onGuest}>
        <Label>ชื่อแขก (ไม่บังคับ)</Label>
        <Input placeholder="เช่น ต้น" />
        {problem ? <FieldError>{problem}</FieldError> : null}
      </TextField>
      <div className="flex gap-2">
        <Button size="lg" variant="secondary" className="flex-1" onPress={onClose}>
          ยกเลิก
        </Button>
        <Button size="lg" className="flex-1" isPending={pending} isDisabled={none || !seatId || problem !== null} onPress={onSubmit}>
          เปิดโต๊ะ
        </Button>
      </div>
    </div>
  );
}
