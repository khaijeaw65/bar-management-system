"use client";

import { FieldError, Label, TextArea, TextField } from "@heroui/react";

export const NOTE_MAX = 500;

export function NoteField({ notes, onChange }: Readonly<{ notes: string; onChange: (value: string) => void }>) {
  const tooLong = notes.length > NOTE_MAX;
  return (
    <TextField value={notes} isInvalid={tooLong} onChange={onChange}>
      <Label>หมายเหตุ (ไม่บังคับ)</Label>
      <TextArea placeholder="เช่น หวานน้อย" />
      {tooLong ? <FieldError>โน้ตยาวเกินไป</FieldError> : null}
    </TextField>
  );
}
