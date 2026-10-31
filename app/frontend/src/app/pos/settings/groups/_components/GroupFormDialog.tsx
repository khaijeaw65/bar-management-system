"use client";

import type { Policy, StaffGroup } from "@bar/contracts";
import { Button, Checkbox, FieldError, Input, Label, Modal, TextField, toast } from "@heroui/react";
import { useState } from "react";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { useSelfGuard } from "@/hooks/useSelfGuard";
import { createGroup, setGroupPolicies, updateGroup } from "@/lib/api/iam";
import { FailureAlert } from "./FailureAlert";

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

const OWNER_COPY = "กลุ่มเจ้าของมีทุกสิทธิ์เสมอ";

/** Create (group = null) or edit; เจ้าของ opens read-only, ผู้จัดการ / พนักงาน keep their name (CD-13 groups·1–3). */
export function GroupFormDialog({
  group,
  groups,
  policies,
  onClose,
}: Readonly<{ group: StaffGroup | null; groups: StaffGroup[]; policies: Policy[]; onClose: () => void }>) {
  const refresh = useRefreshIam();
  const guard = useSelfGuard();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [chosen, setChosen] = useState<string[]>(group?.policyIds ?? []);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const readOnly = group?.system === "owner";
  const trimmed = name.trim();

  async function write() {
    setSaving(true);
    setFailure(null);
    setNameError(null);
    try {
      if (group === null) await createGroup({ name: trimmed, description: description.trim() || undefined, policyIds: chosen });
      else await saveEdit(group);
      toast.success(group === null ? "สร้างกลุ่มแล้ว · มีผลทันที" : "บันทึกแล้ว · มีผลทันที");
      await refresh();
      onClose();
    } catch (error) {
      const result = iamFailure(error);
      if (result.kind === "name_taken") setNameError(result.message);
      else setFailure(result.message);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(current: StaffGroup) {
    const text = { ...(trimmed !== current.name && current.system === null ? { name: trimmed } : {}), ...(description.trim() !== (current.description ?? "") ? { description: description.trim() } : {}) };
    if (Object.keys(text).length > 0) await updateGroup(current.id, text);
    if (!sameIds(chosen, current.policyIds)) await setGroupPolicies(current.id, chosen);
  }

  function submit() {
    const next = groups.map((item) => (item.id === group?.id ? { ...item, policyIds: chosen } : item));
    guard.run({ groups: next }, () => void write());
  }

  const toggle = (id: string, on: boolean) => setChosen((current) => (on ? [...current, id] : current.filter((item) => item !== id)));

  return (
    <>
      <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog aria-label={group === null ? "สร้างกลุ่ม" : "แก้ไขกลุ่ม"}>
            <div className="flex flex-col gap-4">
              <Modal.Heading className="text-heading">{group === null ? "สร้างกลุ่ม" : group.name}</Modal.Heading>
              {readOnly ? <p className="text-body text-text-muted">{OWNER_COPY}</p> : null}
              <TextField value={name} onChange={setName} isDisabled={readOnly || (group !== null && group.system !== null)} isInvalid={nameError !== null}>
                <Label>ชื่อกลุ่ม</Label>
                <Input className="min-h-11" />
                {nameError ? <FieldError>{nameError}</FieldError> : null}
              </TextField>
              <TextField value={description} onChange={setDescription} isDisabled={readOnly}>
                <Label>คำอธิบาย</Label>
                <Input className="min-h-11" />
              </TextField>
              <fieldset className="flex flex-col gap-3" disabled={readOnly}>
                <legend className="text-label text-text-muted">นโยบายสิทธิ์</legend>
                {policies.map((policy) => (
                  <Checkbox key={policy.id} aria-label={policy.name} isDisabled={readOnly} isSelected={chosen.includes(policy.id)} onChange={(on) => toggle(policy.id, on)}>
                    <Checkbox.Content aria-label={policy.name}>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>{policy.name}</Label>
                    </Checkbox.Content>
                  </Checkbox>
                ))}
              </fieldset>
              <FailureAlert message={failure} />
              <div className="flex gap-2">
                <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={onClose}>
                  {readOnly ? "ปิด" : "ยกเลิก"}
                </Button>
                {readOnly ? null : (
                  <Button size="lg" className="min-h-11 flex-1" isDisabled={trimmed === "" || saving} onPress={submit}>
                    บันทึก
                  </Button>
                )}
              </div>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {guard.dialog}
    </>
  );
}
