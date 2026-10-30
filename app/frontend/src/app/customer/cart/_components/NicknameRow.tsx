"use client";

import { Button, Label, TextField, Input } from "@heroui/react";
import { useState } from "react";
import { useNickname } from "../../_hooks/useNickname";

export function NicknameRow({ name }: Readonly<{ name: string | null }>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? "");
  const save = useNickname(() => setEditing(false));
  const tooLong = draft.trim().length > 30;

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-small text-text-muted">สั่งในชื่อ {name ?? "ลูกค้า"}</span>
        <Button variant="ghost" className="min-h-11" onPress={() => { setDraft(name ?? ""); setEditing(true); }}>
          เปลี่ยนชื่อ
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <TextField className="flex-1" value={draft} isInvalid={tooLong} onChange={setDraft}>
        <Label>ชื่อเล่น</Label>
        <Input placeholder="เช่น ต้น" />
      </TextField>
      <Button className="min-h-11" isDisabled={tooLong || save.isPending} onPress={() => save.mutate(draft)}>
        บันทึกชื่อ
      </Button>
    </div>
  );
}
