"use client";

import { CreateMenuCategorySchema } from "@bar/contracts";
import { FieldError, Input, TextField } from "@heroui/react";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";

// Enter saves, Esc cancels. A taken name keeps the typed value and says so under the field.
export function CategoryNameInput({
  initial,
  label,
  onSave,
  onCancel,
}: Readonly<{ initial: string; label: string; onSave: (name: string) => Promise<unknown>; onCancel: () => void }>) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const parsed = CreateMenuCategorySchema.safeParse({ name: value });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "ชื่อไม่ถูกต้อง");
    if (parsed.data.name === initial) return onCancel();
    try {
      await onSave(parsed.data.name);
    } catch (caught) {
      const taken = caught instanceof ApiError && caught.code === "CATEGORY_NAME_TAKEN";
      setError(taken ? "มีหมวดชื่อนี้แล้ว" : "บันทึกไม่สำเร็จ — ลองอีกครั้ง");
    }
  };

  return (
    <TextField
      autoFocus
      aria-label={label}
      value={value}
      isInvalid={error !== null}
      onChange={(next) => {
        setValue(next);
        setError(null);
      }}
      onBlur={() => {
        if (initial !== "") void submit();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") void submit();
        if (event.key === "Escape") onCancel();
      }}
    >
      <Input placeholder="ชื่อหมวดใหม่" />
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}
