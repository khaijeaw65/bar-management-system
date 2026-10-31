"use client";

import { FieldError, Input, Label, Radio, RadioGroup, TextField } from "@heroui/react";
import { customError, localInputNow, type UntilChoice, type UntilMode } from "./membership";

const MODES: ReadonlyArray<{ value: UntilMode; label: string }> = [
  { value: "permanent", label: "ถาวร" },
  { value: "end_of_night", label: "ถึงสิ้นกะคืนนี้" },
  { value: "custom", label: "กำหนดเอง" },
];

export function UntilPicker({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: UntilChoice; onChange: (next: UntilChoice) => void }>) {
  const now = new Date();
  const error = customError(value, now);

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-label={`ระยะเวลา ${label}`}
        orientation="horizontal"
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode: mode as UntilMode })}
      >
        {MODES.map((mode) => (
          <Radio key={mode.value} value={mode.value} aria-label={mode.label}>
            <Radio.Content aria-label={mode.label}>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Label>{mode.label}</Label>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
      {value.mode === "custom" ? (
        <TextField isInvalid={error !== null} onChange={(custom) => onChange({ ...value, custom })} value={value.custom}>
          <Label>วันและเวลาที่สิ้นสุด</Label>
          <Input type="datetime-local" min={localInputNow(now)} className="min-h-11" />
          {error ? <FieldError>{error}</FieldError> : null}
        </TextField>
      ) : null}
    </div>
  );
}
