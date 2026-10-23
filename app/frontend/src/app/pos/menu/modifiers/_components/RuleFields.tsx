"use client";

import { FieldError, Label, NumberField } from "@heroui/react";
import { MenuSwitch } from "../../_components/MenuSwitch";
import type { GroupDraft, GroupErrors } from "../_lib/group";

function Count({
  label,
  value,
  min,
  disabled,
  error,
  onChange,
}: Readonly<{ label: string; value: number; min: number; disabled?: boolean; error?: string; onChange: (value: number) => void }>) {
  return (
    <NumberField className="flex-1" value={value} minValue={min} maxValue={20} isDisabled={disabled} isInvalid={error !== undefined} onChange={(next) => onChange(Number.isNaN(next) ? min : next)}>
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {error ? <FieldError>{error}</FieldError> : null}
    </NumberField>
  );
}

export function RuleFields({
  draft,
  errors,
  onChange,
}: Readonly<{ draft: GroupDraft; errors: GroupErrors; onChange: (changes: Partial<GroupDraft>) => void }>) {
  return (
    <div className="flex flex-col gap-3">
      <MenuSwitch
        label="ต้องเลือก"
        isSelected={draft.isRequired}
        onChange={(isRequired) => onChange({ isRequired, minSelect: isRequired ? Math.max(draft.minSelect, 1) : 0 })}
      />
      <div className="flex gap-3">
        <Count label="ขั้นต่ำ" value={draft.isRequired ? draft.minSelect : 0} min={0} disabled={!draft.isRequired} error={errors.minSelect} onChange={(minSelect) => onChange({ minSelect })} />
        <Count label="สูงสุด" value={draft.maxSelect} min={1} error={errors.maxSelect} onChange={(maxSelect) => onChange({ maxSelect })} />
      </div>
    </div>
  );
}
