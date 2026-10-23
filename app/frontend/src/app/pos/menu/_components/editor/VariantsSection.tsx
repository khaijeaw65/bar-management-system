"use client";

import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import { variantNameKey, variantPriceKey, type DraftErrors, type MenuDraft, type VariantDraft } from "../../_lib/draft";
import { EditorCard } from "./EditorCard";

function VariantRow({
  variant,
  errors,
  canRemove,
  onChange,
  onRemove,
}: Readonly<{
  variant: VariantDraft;
  errors: DraftErrors;
  canRemove: boolean;
  onChange: (changes: Partial<VariantDraft>) => void;
  onRemove: () => void;
}>) {
  const nameError = errors[variantNameKey(variant.key)];
  const priceError = errors[variantPriceKey(variant.key)];

  return (
    <div className="flex items-start gap-2">
      <TextField className="flex-1" value={variant.name} isInvalid={nameError !== undefined} onChange={(name) => onChange({ name })}>
        <Label>ชื่อตัวเลือก</Label>
        <Input />
        {nameError ? <FieldError>{nameError}</FieldError> : null}
      </TextField>
      <TextField
        className="w-32"
        value={variant.price}
        isInvalid={priceError !== undefined}
        inputMode="decimal"
        onChange={(price) => onChange({ price })}
      >
        <Label>ราคา</Label>
        <Input placeholder="0.00" />
        {priceError ? <FieldError>{priceError}</FieldError> : null}
      </TextField>
      <Button
        isIconOnly
        variant="ghost"
        className="mt-6"
        aria-label={`ลบตัวเลือก ${variant.name || "ใหม่"}`}
        isDisabled={!canRemove}
        onPress={onRemove}
      >
        <Trash2 size={16} aria-hidden />
      </Button>
    </div>
  );
}

export function VariantsSection({
  draft,
  errors,
  onChange,
  onAdd,
  onRemove,
}: Readonly<{
  draft: MenuDraft;
  errors: DraftErrors;
  onChange: (key: string, changes: Partial<VariantDraft>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
}>) {
  return (
    <EditorCard title="ตัวเลือก (ราคา)">
      <p className="text-small text-text-muted">
        ทุกเมนูมีอย่างน้อย 1 ตัวเลือก — แถวแรกคือราคาปกติของเมนู · ราคาที่แก้ไม่กระทบออเดอร์ที่สั่งไปแล้ว
      </p>
      {errors.variants ? <p role="alert" className="text-small text-text-danger">{errors.variants}</p> : null}
      {draft.variants.map((variant, index) => (
        <VariantRow
          key={variant.key}
          variant={variant}
          errors={errors}
          canRemove={index > 0}
          onChange={(changes) => onChange(variant.key, changes)}
          onRemove={() => onRemove(variant.key)}
        />
      ))}
      <div>
        <Button variant="secondary" size="sm" onPress={onAdd}>
          <Plus size={16} aria-hidden />
          เพิ่มตัวเลือก
        </Button>
      </div>
    </EditorCard>
  );
}
