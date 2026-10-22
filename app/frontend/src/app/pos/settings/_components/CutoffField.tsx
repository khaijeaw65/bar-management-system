"use client";

import { Description, FieldError, Label, TimeField } from "@heroui/react";
import { Time } from "@internationalized/date";

function toTime(value: string): Time {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return new Time(hours, minutes);
}

function two(value: number): string {
  return String(value).padStart(2, "0");
}

export function CutoffField({
  value,
  error,
  onChange,
}: Readonly<{ value: string; error?: string; onChange: (value: string) => void }>) {
  return (
    <TimeField
      value={toTime(value)}
      hourCycle={24}
      isInvalid={error !== undefined}
      onChange={(time) => {
        if (time) onChange(`${two(time.hour)}:${two(time.minute)}`);
      }}
    >
      <Label>เวลาตัดรอบวัน</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      <Description>ใช้กับเลขออเดอร์ รายงาน และ &quot;ถึงสิ้นกะคืนนี้&quot; — เปลี่ยนแล้วมีผลตั้งแต่วันทำการถัดไป</Description>
      {error ? <FieldError>{error}</FieldError> : null}
    </TimeField>
  );
}
