"use client";

import type { MembershipInput, StaffGroup, StaffMember } from "@bar/contracts";
import { Button, Label, Modal, Radio, RadioGroup } from "@heroui/react";
import { useState } from "react";
import { PERMANENT, untilOf, type UntilChoice } from "./membership";
import { UntilPicker } from "./UntilPicker";

export function AddGroupDialog({
  member,
  groups,
  saving,
  onClose,
  onAdd,
}: Readonly<{
  member: StaffMember;
  groups: StaffGroup[];
  saving: boolean;
  onClose: () => void;
  onAdd: (groupId: string, until: MembershipInput["until"]) => void;
}>) {
  const held = new Set(member.memberships.filter((row) => row.state !== "expired").map((row) => row.groupId));
  const available = groups.filter((group) => !held.has(group.id));
  const [groupId, setGroupId] = useState("");
  const [choice, setChoice] = useState<UntilChoice>(PERMANENT);
  const until = untilOf(choice, new Date());

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog aria-label="เพิ่มกลุ่ม">
          <div className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">เพิ่มกลุ่มให้ {member.displayName}</Modal.Heading>
            {available.length === 0 ? <p className="text-body text-text-muted">อยู่ครบทุกกลุ่มแล้ว</p> : null}
            <RadioGroup aria-label="กลุ่ม" value={groupId} onChange={setGroupId}>
              {available.map((group) => (
                <Radio key={group.id} value={group.id} aria-label={group.name}>
                  <Radio.Content aria-label={group.name}>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <Label>{group.name}</Label>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
            <UntilPicker label="กลุ่มใหม่" value={choice} onChange={setChoice} />
            <div className="flex gap-2">
              <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button size="lg" className="min-h-11 flex-1" isDisabled={groupId === "" || until === null || saving} onPress={() => until !== null && onAdd(groupId, until)}>
                เพิ่มกลุ่ม
              </Button>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
