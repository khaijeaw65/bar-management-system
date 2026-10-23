"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { Button, Card, Chip } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { ruleLabel } from "../_lib/group";

export function ModifierGroupList({
  groups,
  onEdit,
  onDelete,
}: Readonly<{ groups: ModifierGroupAdmin[]; onEdit: (group: ModifierGroupAdmin) => void; onDelete: (group: ModifierGroupAdmin) => void }>) {
  return (
    <ul className="flex flex-col gap-2" aria-label="กลุ่มตัวเลือกเสริม">
      {groups.map((group) => {
        const used = group.usedByItems > 0;
        return (
          <li key={group.id}>
            <Card>
              <Card.Content className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="flex-1 justify-start" aria-label={`แก้ไขกลุ่ม ${group.name}`} onPress={() => onEdit(group)}>
                    {group.name}
                  </Button>
                  <Chip size="sm">{ruleLabel(group)}</Chip>
                  <span className="text-small text-text-muted">{group.options.filter((option) => option.isAvailable).length} ตัวเลือก</span>
                  <span className="text-small text-text-muted">ใช้กับ {group.usedByItems} เมนู</span>
                  <Button isIconOnly variant="ghost" aria-label={`ลบกลุ่ม ${group.name}`} isDisabled={used} onPress={() => onDelete(group)}>
                    <Trash2 size={16} aria-hidden />
                  </Button>
                </div>
                {used ? <p className="text-small text-text-muted">ใช้อยู่ใน {group.usedByItems} เมนู — ถอดออกจากเมนูก่อน</p> : null}
              </Card.Content>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
