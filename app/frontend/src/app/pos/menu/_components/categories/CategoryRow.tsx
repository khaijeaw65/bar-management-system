"use client";

import type { MenuCategory } from "@bar/contracts";
import { Button } from "@heroui/react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button as DragHandle } from "react-aria-components";
import { MenuSwitch } from "../MenuSwitch";
import { CategoryNameInput } from "./CategoryNameInput";

export function CategoryRow({
  category,
  first,
  last,
  onMove,
  onActive,
  onRename,
  onDelete,
}: Readonly<{
  category: MenuCategory;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onActive: (isActive: boolean) => void;
  onRename: (name: string) => Promise<unknown>;
  onDelete: () => void;
}>) {
  const [renaming, setRenaming] = useState(false);
  const blocked = category.itemCount > 0;

  return (
    <div className={`flex flex-col gap-1 ${category.isActive ? "" : "text-text-muted"}`}>
      <div className="flex items-center gap-2">
        <DragHandle slot="drag" aria-label={`ลากเพื่อย้าย ${category.name}`} className="cursor-grab text-text-muted">
          <GripVertical size={16} aria-hidden />
        </DragHandle>
        <Button isIconOnly size="sm" variant="ghost" aria-label={`ย้าย ${category.name} ขึ้น`} isDisabled={first} onPress={() => onMove(-1)}>
          <ArrowUp size={14} aria-hidden />
        </Button>
        <Button isIconOnly size="sm" variant="ghost" aria-label={`ย้าย ${category.name} ลง`} isDisabled={last} onPress={() => onMove(1)}>
          <ArrowDown size={14} aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <CategoryNameInput
              initial={category.name}
              label={`ชื่อหมวด ${category.name}`}
              onSave={async (name) => {
                await onRename(name);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <Button variant="ghost" size="sm" aria-label={`แก้ชื่อ ${category.name}`} onPress={() => setRenaming(true)}>
              {category.name}
            </Button>
          )}
        </div>
        <span className="text-small tabular-nums text-text-muted">{category.itemCount} เมนู</span>
        <MenuSwitch hideLabel label={`แสดง ${category.name}`} isSelected={category.isActive} onChange={onActive} />
        <Button isIconOnly size="sm" variant="ghost" aria-label={`ลบ ${category.name}`} isDisabled={blocked} onPress={onDelete}>
          <Trash2 size={16} aria-hidden />
        </Button>
      </div>
      {category.isActive ? null : <p className="pl-16 text-small">ซ่อนจากเมนูลูกค้าและ POS</p>}
      {blocked ? <p className="pl-16 text-small text-text-muted">ลบไม่ได้ — ยังมี {category.itemCount} เมนูในหมวดนี้</p> : null}
    </div>
  );
}
