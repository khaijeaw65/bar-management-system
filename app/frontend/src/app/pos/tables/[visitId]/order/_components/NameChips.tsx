"use client";

import { Button, FieldError, Input, Label, Popover, Tag, TagGroup, TextField } from "@heroui/react";

export function NameChips({
  names,
  who,
  draft,
  naming,
  onWho,
  onDraft,
  onNaming,
  onAdd,
}: Readonly<{
  names: readonly string[];
  who: string | null;
  draft: string;
  naming: boolean;
  onWho: (name: string | null) => void;
  onDraft: (value: string) => void;
  onNaming: (open: boolean) => void;
  onAdd: () => void;
}>) {
  const tooLong = draft.trim().length > 30;

  return (
    <div className="flex flex-col gap-2">
      <Label>สั่งโดย</Label>
      <div className="flex flex-wrap items-center gap-2">
        <TagGroup
          selectionMode="single"
          selectedKeys={who ? [who] : []}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            onWho(next === undefined ? null : String(next));
          }}
        >
          <TagGroup.List>
            {names.map((name) => (
              <Tag key={name} id={name}>
                {name}
              </Tag>
            ))}
          </TagGroup.List>
        </TagGroup>
        <Popover isOpen={naming} onOpenChange={onNaming}>
          <Popover.Trigger>
            <Button size="sm" variant="secondary">
              + ชื่อใหม่
            </Button>
          </Popover.Trigger>
          <Popover.Content>
            <Popover.Dialog className="flex w-78 flex-col gap-3">
              <Popover.Heading>ชื่อผู้สั่ง</Popover.Heading>
              <TextField value={draft} isInvalid={tooLong} onChange={onDraft}>
                <Label>เช่น แพร</Label>
                <Input />
                <p className="text-small text-text-muted">ใช้กับตะกร้านี้ · สูงสุด 30 ตัวอักษร</p>
                {tooLong ? <FieldError>ชื่อยาวเกินไป</FieldError> : null}
              </TextField>
              <Button size="sm" isDisabled={draft.trim().length === 0 || tooLong} onPress={onAdd}>
                เพิ่มชื่อ
              </Button>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </div>
  );
}
