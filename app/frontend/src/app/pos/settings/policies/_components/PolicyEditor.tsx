"use client";

import type { PermissionCode, Policy, StaffGroup, StaffMember } from "@bar/contracts";
import { Button, FieldError, Input, Label, TextField, toast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCatalog, useGroups, usePolicies, useStaffList } from "@/hooks/useIamData";
import { iamFailure, useRefreshIam, type IamFailure } from "@/hooks/useIamWrite";
import { useSelfGuard } from "@/hooks/useSelfGuard";
import { createPolicy, deletePolicy, setPolicyCodes, updatePolicy } from "@/lib/api/iam";
import { orderedCodes } from "@/lib/permissions/catalog";
import { FailureAlert } from "../../groups/_components/FailureAlert";
import { PolicyMatrix } from "./PolicyMatrix";

interface Draft {
  name: string;
  description: string;
  codes: PermissionCode[];
}

function namesUsing(policy: Policy | null, groups: StaffGroup[], staff: StaffMember[]): string[] {
  if (policy === null) return [];
  return [...groups.filter((group) => group.policyIds.includes(policy.id)).map((group) => `กลุ่ม ${group.name}`), ...staff.filter((member) => member.policyIds.includes(policy.id)).map((member) => member.displayName)];
}

async function persist(policy: Policy | null, draft: Draft, changed: { nameChanged: boolean; descriptionChanged: boolean; codesChanged: boolean }) {
  if (policy === null) {
    await createPolicy({ name: draft.name, description: draft.description || undefined, codes: draft.codes });
    return;
  }
  const text = { ...(changed.nameChanged ? { name: draft.name } : {}), ...(changed.descriptionChanged ? { description: draft.description } : {}) };
  if (Object.keys(text).length > 0) await updatePolicy(policy.id, text);
  if (changed.codesChanged) await setPolicyCodes(policy.id, draft.codes);
}

/** The editable copy of a policy plus how far it has drifted from what the server last said. */
function usePolicyDraft(policy: Policy | null) {
  const original = new Set<PermissionCode>(policy?.codes ?? []);
  const [selected, setSelected] = useState<Set<PermissionCode>>(original);
  const [name, setName] = useState(policy?.name ?? "");
  const [description, setDescription] = useState(policy?.description ?? "");
  const nameChanged = policy !== null && name.trim() !== policy.name;
  const descriptionChanged = policy !== null && description.trim() !== (policy.description ?? "");
  const codeChanges = [...selected].filter((code) => !original.has(code)).length + [...original].filter((code) => !selected.has(code)).length;
  return { original, selected, setSelected, name, setName, description, setDescription, nameChanged, descriptionChanged, codeChanges };
}

/** Matrix editor for one policy, or a new one (policy = null). Nothing is sent until บันทึก, and then as one full set. */
export function PolicyEditor({ policy, onBack }: Readonly<{ policy: Policy | null; onBack: () => void }>) {
  const catalog = useCatalog();
  const groups = useGroups();
  const policies = usePolicies();
  const staff = useStaffList();
  const refresh = useRefreshIam();
  const guard = useSelfGuard();
  const { original, selected, setSelected, name, setName, description, setDescription, nameChanged, descriptionChanged, codeChanges } = usePolicyDraft(policy);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState<IamFailure | null>(null);
  const [confirming, setConfirming] = useState<"use" | "delete" | null>(null);
  const [saving, setSaving] = useState(false);
  const readOnly = policy?.system === "all";
  const changes = codeChanges + (nameChanged ? 1 : 0) + (descriptionChanged ? 1 : 0);
  const usedBy = namesUsing(policy, groups.data ?? [], staff.data ?? []);

  async function write() {
    if (!catalog.data) return;
    setSaving(true);
    setFailure(null);
    setNameError(null);
    try {
      await persist(policy, { name: name.trim(), description: description.trim(), codes: orderedCodes(catalog.data, selected) }, { nameChanged, descriptionChanged, codesChanged: codeChanges > 0 });
      toast.success(policy === null ? "สร้างนโยบายแล้ว · มีผลทันที" : "บันทึกแล้ว · มีผลทันที");
      await refresh();
      onBack();
    } catch (error) {
      const result = iamFailure(error);
      if (result.kind === "name_taken") setNameError(result.message);
      else setFailure(result);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  function commit() {
    const next = (policies.data ?? []).map((item) => (item.id === policy?.id ? { ...item, codes: orderedCodes(catalog.data ?? [], selected) } : item));
    guard.run({ policies: next }, () => void write());
  }

  function requestSave() {
    if (policy !== null && codeChanges > 0 && policy.usage.groups + policy.usage.users > 1) setConfirming("use");
    else commit();
  }

  function cancel() {
    if (policy === null) return onBack();
    setSelected(new Set(original));
    setName(policy.name);
    setDescription(policy.description ?? "");
  }

  async function remove() {
    if (policy === null) return;
    setConfirming(null);
    setSaving(true);
    try {
      await deletePolicy(policy.id);
      toast.success(`ลบนโยบาย ${policy.name} แล้ว · มีผลทันที`);
      await refresh();
      onBack();
    } catch (error) {
      setFailure(iamFailure(error));
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4 pb-24">
      <button type="button" onClick={onBack} className="flex min-h-11 items-center gap-1 self-start text-small text-text-muted">
        <ArrowLeft size={16} aria-hidden />
        นโยบายทั้งหมด
      </button>
      <h1 className="text-xl font-semibold">{policy === null ? "สร้างนโยบาย" : policy.name}</h1>
      {readOnly ? <p className="text-body text-text-muted">ระบบ · ทุกสิทธิ์ แก้ไขหรือลบไม่ได้</p> : null}
      <TextField value={name} onChange={setName} isDisabled={readOnly} isInvalid={nameError !== null}>
        <Label>ชื่อนโยบาย</Label>
        <Input className="min-h-11" />
        {nameError ? <FieldError>{nameError}</FieldError> : null}
      </TextField>
      <TextField value={description} onChange={setDescription} isDisabled={readOnly}>
        <Label>คำอธิบาย</Label>
        <Input className="min-h-11" />
      </TextField>
      <FailureAlert message={failure && failure.kind !== "in_use" ? failure.message : null} />
      {failure?.kind === "in_use" ? <InUseAlert failure={failure} staff={staff.data ?? []} /> : null}
      {catalog.data ? <PolicyMatrix catalog={catalog.data} selected={selected} readOnly={readOnly} onChange={setSelected} /> : null}
      {policy !== null && !readOnly ? (
        <Button size="lg" variant="danger-soft" className="min-h-11 self-start" isDisabled={saving} onPress={() => setConfirming("delete")}>
          ลบนโยบาย
        </Button>
      ) : null}
      {readOnly ? null : (
        <SaveBar
          label={policy === null ? "นโยบายใหม่" : `แก้ไข ${changes} รายการ`}
          saving={saving}
          canSave={name.trim() !== "" && (policy === null || changes > 0)}
          onCancel={cancel}
          onSave={requestSave}
        />
      )}
      {confirming === "use" ? (
        <ConfirmDialog title="นโยบายนี้ถูกใช้หลายที่" confirmLabel="บันทึกต่อ" onCancel={() => setConfirming(null)} onConfirm={() => { setConfirming(null); commit(); }}>
          <p className="text-body text-text-muted">การแก้ไขมีผลกับทุกที่ที่ใช้: {usedBy.join(", ")}</p>
        </ConfirmDialog>
      ) : null}
      {confirming === "delete" ? (
        <ConfirmDialog title={`ลบนโยบาย ${policy?.name ?? ""}?`} confirmLabel="ลบนโยบาย" danger onCancel={() => setConfirming(null)} onConfirm={() => void remove()} />
      ) : null}
      {guard.dialog}
    </div>
  );
}

function InUseAlert({ failure, staff }: Readonly<{ failure: Extract<IamFailure, { kind: "in_use" }>; staff: Array<{ id: string; displayName: string }> }>) {
  return (
    <div role="alert" className="flex flex-col gap-1 rounded-card border border-line-hairline bg-danger-soft p-3 text-body">
      <span>ลบไม่ได้ ยังมีที่ใช้นโยบายนี้อยู่ — ถอดออกก่อน</span>
      {failure.groups.length > 0 ? (
        <span>
          กลุ่ม: {failure.groups.map((group) => <Link key={group} href="/pos/settings/groups" className="mr-2 underline">{group}</Link>)}
        </span>
      ) : null}
      {failure.users.length > 0 ? (
        <span>
          คน: {failure.users.map((user) => {
            const id = staff.find((member) => member.displayName === user)?.id;
            return id ? <Link key={user} href={`/pos/settings/staff/${id}`} className="mr-2 underline">{user}</Link> : <span key={user} className="mr-2">{user}</span>;
          })}
        </span>
      ) : null}
    </div>
  );
}

function SaveBar({ label, saving, canSave, onCancel, onSave }: Readonly<{ label: string; saving: boolean; canSave: boolean; onCancel: () => void; onSave: () => void }>) {
  return (
    <section aria-label="บันทึกการแก้ไข" className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-3 border-t border-line-hairline bg-surface p-3">
      <span className="flex-1 text-body">{label}</span>
      <Button size="lg" variant="secondary" className="min-h-11" isDisabled={saving} onPress={onCancel}>
        ยกเลิก
      </Button>
      <Button size="lg" className="min-h-11" isDisabled={saving || !canSave} onPress={onSave}>
        บันทึก
      </Button>
    </section>
  );
}
