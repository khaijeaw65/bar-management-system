"use client";

import type { AccessRequest, StaffMember } from "@bar/contracts";
import { Alert, Button, Checkbox, FieldError, Input, Label, Modal, TextField, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { approveAccessRequest, getStaffGroups, STAFF_GROUPS_KEY } from "@/lib/api/staff";
import { PERMANENT, untilOf, type UntilChoice } from "./membership";
import { UntilPicker } from "./UntilPicker";

const NAME_MAX = 200;

export function ApproveDialog({
  request,
  onClose,
  onApproved,
}: Readonly<{ request: AccessRequest; onClose: () => void; onApproved: (member: StaffMember) => void }>) {
  const groups = useQuery({ queryKey: STAFF_GROUPS_KEY, queryFn: getStaffGroups, staleTime: 60_000, retry: false });
  const refresh = useRefreshIam();
  const [name, setName] = useState(request.displayName ?? "");
  const [chosen, setChosen] = useState<Record<string, UntilChoice>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const trimmed = name.trim();
  const ids = Object.keys(chosen);
  const nameError = trimmed === "" ? "กรุณากรอกชื่อ" : trimmed.length > NAME_MAX ? `ชื่อยาวเกิน ${NAME_MAX} ตัวอักษร` : null;
  const memberships = ids.map((groupId) => ({ groupId, until: untilOf(chosen[groupId] ?? PERMANENT, now) }));
  const ready = nameError === null && ids.length > 0 && memberships.every((row) => row.until !== null);

  function toggle(groupId: string, on: boolean) {
    setChosen((current) => {
      const next = { ...current };
      if (on) next[groupId] = PERMANENT;
      else delete next[groupId];
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setFailure(null);
    try {
      const member = await approveAccessRequest(request.id, {
        displayName: trimmed,
        memberships: memberships.flatMap((row) => (row.until === null ? [] : [{ groupId: row.groupId, until: row.until }])),
      });
      await refresh();
      toast.success(`อนุมัติ ${member.displayName} แล้ว`);
      onApproved(member);
    } catch (error) {
      const result = iamFailure(error);
      if (result.kind === "decided") {
        toast.danger(result.message);
        await refresh();
        onClose();
      } else {
        setFailure(result.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog aria-label="อนุมัติคำขอ">
          <div className="flex flex-col gap-4">
            <Modal.Heading className="text-heading">อนุมัติคำขอเข้าใช้งาน</Modal.Heading>
            <TextField value={name} onChange={setName} isInvalid={nameError !== null && name !== ""}>
              <Label>ชื่อที่แสดง</Label>
              <Input className="min-h-11" />
              {name !== "" && nameError ? <FieldError>{nameError}</FieldError> : null}
            </TextField>
            <fieldset className="flex flex-col gap-3">
              <legend className="text-label text-text-muted">กลุ่มสิทธิ์</legend>
              {groups.isPending ? <p className="text-small text-text-muted">กำลังโหลดกลุ่ม…</p> : null}
              {groups.isError ? <p role="alert" className="text-small text-text-danger">โหลดกลุ่มไม่สำเร็จ</p> : null}
              {groups.data?.map((group) => (
                <div key={group.id} className="flex flex-col gap-2">
                  <Checkbox aria-label={group.name} isSelected={group.id in chosen} onChange={(on) => toggle(group.id, on)}>
                    <Checkbox.Content aria-label={group.name}>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>{group.name}</Label>
                    </Checkbox.Content>
                  </Checkbox>
                  {group.id in chosen ? (
                    <div className="ml-7">
                      <UntilPicker
                        label={group.name}
                        value={chosen[group.id] ?? PERMANENT}
                        onChange={(next) => setChosen((current) => ({ ...current, [group.id]: next }))}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              {ids.length === 0 ? <p className="text-small text-text-muted">เลือกอย่างน้อย 1 กลุ่ม</p> : null}
            </fieldset>
            {failure ? (
              <Alert status="danger" role="alert">
                <Alert.Content>
                  <Alert.Description>{failure}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
            <div className="flex gap-2">
              <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button size="lg" className="min-h-11 flex-1" isDisabled={!ready || saving} onPress={() => void submit()}>
                อนุมัติ
              </Button>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
