"use client";

import type { ItemType, KitchenStation } from "@bar/contracts";
import { Description, FieldError, Label, Radio, RadioGroup, Switch } from "@heroui/react";
import type { DraftErrors, MenuDraft } from "../../_lib/draft";
import { EditorCard } from "./EditorCard";

const TYPES: Array<{ value: ItemType; label: string; hint: string }> = [
  { value: "simple", label: "ทั่วไป", hint: "ขายตามราคาที่ตั้ง" },
  { value: "recipe", label: "สูตร", hint: "บันทึกเหมือนทั่วไปไปก่อน — ตัดสต็อกตามสูตรมาทีหลัง" },
  { value: "charge", label: "ค่าบริการ", hint: "ไม่ส่งไปบาร์หรือครัว — ขึ้นบิลเป็น เสิร์ฟแล้ว ทันทีเมื่อสั่ง" },
];

const STATIONS: Array<{ value: KitchenStation; label: string }> = [
  { value: "bar", label: "บาร์" },
  { value: "food", label: "ครัว" },
];

function Option({ value, label, hint }: Readonly<{ value: string; label: string; hint?: string }>) {
  return (
    <Radio value={value}>
      <Radio.Content>
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Label>{label}</Label>
        {hint ? <Description>{hint}</Description> : null}
      </Radio.Content>
    </Radio>
  );
}

export function TypeSection({
  draft,
  errors,
  onChange,
}: Readonly<{ draft: MenuDraft; errors: DraftErrors; onChange: (changes: Partial<MenuDraft>) => void }>) {
  const charge = draft.itemType === "charge";

  return (
    <EditorCard title="ประเภทและการส่ง">
      <RadioGroup
        aria-label="ประเภท"
        value={draft.itemType}
        onChange={(value) => onChange({ itemType: value as ItemType, station: value === "charge" ? null : draft.station })}
      >
        {TYPES.map((type) => (
          <Option key={type.value} {...type} />
        ))}
      </RadioGroup>
      {charge ? null : (
        <RadioGroup
          aria-label="ส่งไปที่"
          value={draft.station ?? ""}
          isInvalid={errors.station !== undefined}
          onChange={(value) => onChange({ station: value as KitchenStation })}
        >
          <Label>ส่งไปที่</Label>
          {STATIONS.map((station) => (
            <Option key={station.value} {...station} />
          ))}
          {errors.station ? <FieldError>{errors.station}</FieldError> : null}
        </RadioGroup>
      )}
      <Switch isSelected={draft.isPromo} onChange={(isPromo) => onChange({ isPromo })}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Content>
          <Label>เมนูโปร</Label>
          <Description>แสดงป้ายโปร — ราคาเป็นตามที่ตั้ง ไม่มีราคาขีดฆ่า</Description>
        </Switch.Content>
      </Switch>
    </EditorCard>
  );
}
