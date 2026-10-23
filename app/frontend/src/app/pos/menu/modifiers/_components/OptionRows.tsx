"use client";

import { Button, FieldError, Input, Label, Switch, TextField } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import { optionNameKey, optionPriceKey, type GroupErrors, type OptionDraft } from "../_lib/group";

function OptionRow({
  option,
  errors,
  onChange,
  onRemove,
}: Readonly<{ option: OptionDraft; errors: GroupErrors; onChange: (changes: Partial<OptionDraft>) => void; onRemove: () => void }>) {
  const nameError = errors[optionNameKey(option.key)];
  const priceError = errors[optionPriceKey(option.key)];

  return (
    <div className="flex items-start gap-2">
      <TextField className="flex-1" aria-label="ชื่อตัวเลือก" value={option.name} isInvalid={nameError !== undefined} onChange={(name) => onChange({ name })}>
        <Input placeholder="ชื่อตัวเลือก" />
        {nameError ? <FieldError>{nameError}</FieldError> : null}
      </TextField>
      <TextField className="w-24" aria-label="ราคาเพิ่ม" value={option.priceDelta} inputMode="decimal" isInvalid={priceError !== undefined} onChange={(priceDelta) => onChange({ priceDelta })}>
        <Input placeholder="+฿" />
        {priceError ? <FieldError>{priceError}</FieldError> : null}
      </TextField>
      <Switch className="mt-2" isSelected={option.on} onChange={(on) => onChange({ on })}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label className="sr-only">ขาย {option.name || "ตัวเลือกใหม่"}</Label>
        </Switch.Content>
      </Switch>
      {option.id ? null : (
        <Button isIconOnly variant="ghost" aria-label={`ลบตัวเลือก ${option.name || "ใหม่"}`} onPress={onRemove}>
          <Trash2 size={16} aria-hidden />
        </Button>
      )}
    </div>
  );
}

export function OptionRows({
  options,
  errors,
  onChange,
  onAdd,
  onRemove,
}: Readonly<{
  options: OptionDraft[];
  errors: GroupErrors;
  onChange: (key: string, changes: Partial<OptionDraft>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
}>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-small font-medium">ตัวเลือก</legend>
      {errors.options ? <p role="alert" className="text-small text-text-danger">{errors.options}</p> : null}
      {options.map((option) => (
        <OptionRow key={option.key} option={option} errors={errors} onChange={(changes) => onChange(option.key, changes)} onRemove={() => onRemove(option.key)} />
      ))}
      <div>
        <Button variant="secondary" size="sm" onPress={onAdd}>
          <Plus size={16} aria-hidden />
          เพิ่มตัวเลือก
        </Button>
      </div>
    </fieldset>
  );
}
