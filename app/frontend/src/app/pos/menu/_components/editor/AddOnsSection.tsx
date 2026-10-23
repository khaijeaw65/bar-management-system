"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { ToggleChip } from "../ToggleChip";
import { EditorCard } from "./EditorCard";

export function AddOnsSection({
  groups,
  selected,
  onToggle,
}: Readonly<{ groups: ModifierGroupAdmin[]; selected: string[]; onToggle: (id: string) => void }>) {
  return (
    <EditorCard title="ตัวเลือกเสริม">
      <p className="text-small text-text-muted">ผูกกับทุกตัวเลือกราคาของเมนูนี้</p>
      {groups.length === 0 ? (
        <p className="text-small text-text-faint">ยังไม่มีกลุ่มตัวเลือกเสริม</p>
      ) : (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">กลุ่มตัวเลือกเสริม</legend>
          {groups.map((group) => (
            <ToggleChip key={group.id} selected={selected.includes(group.id)} onToggle={() => onToggle(group.id)}>
              {group.name}
            </ToggleChip>
          ))}
        </fieldset>
      )}
    </EditorCard>
  );
}
