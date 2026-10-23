"use client";

import type { MenuCategory } from "@bar/contracts";
import { FieldError, Input, Label, ListBox, Select, TextArea, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import type { DraftErrors, MenuDraft } from "../../_lib/draft";
import { EditorCard } from "./EditorCard";

export function BasicsSection({
  draft,
  errors,
  categories,
  photo,
  onChange,
}: Readonly<{
  draft: MenuDraft;
  errors: DraftErrors;
  categories: MenuCategory[];
  photo: ReactNode;
  onChange: (changes: Partial<MenuDraft>) => void;
}>) {
  return (
    <EditorCard title="ข้อมูลหลัก">
      {photo}
      <TextField value={draft.name} isInvalid={errors.name !== undefined} onChange={(name) => onChange({ name })}>
        <Label>ชื่อเมนู</Label>
        <Input placeholder="เช่น โอลด์แฟชั่น" />
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}
      </TextField>
      <Select
        placeholder="เลือกหมวด"
        selectedKey={draft.categoryId || null}
        isInvalid={errors.categoryId !== undefined}
        onSelectionChange={(key) => onChange({ categoryId: key == null ? "" : String(key) })}
      >
        <Label>หมวด</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        {errors.categoryId ? <FieldError>{errors.categoryId}</FieldError> : null}
        <Select.Popover>
          <ListBox>
            {categories.map((category) => {
              const text = category.isActive ? category.name : `${category.name} (ซ่อนอยู่)`;
              return (
                <ListBox.Item key={category.id} id={category.id} textValue={text}>
                  {text}
                </ListBox.Item>
              );
            })}
          </ListBox>
        </Select.Popover>
      </Select>
      <TextField
        value={draft.description}
        isInvalid={errors.description !== undefined}
        onChange={(description) => onChange({ description })}
      >
        <Label>คำอธิบาย (ไม่บังคับ)</Label>
        <TextArea />
        {errors.description ? <FieldError>{errors.description}</FieldError> : null}
      </TextField>
    </EditorCard>
  );
}
