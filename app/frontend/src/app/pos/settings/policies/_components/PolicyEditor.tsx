"use client";

import type { PermissionCode, Policy } from "@bar/contracts";
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

/** Matrix editor for one policy, or a new one (policy = null). Nothing is sent until บันทึก, and then as one full set. */
export function PolicyEditor({ policy, onBack }: Readonly<{ policy: Policy | null; onBack: () => void }>) {
  const catalog = useCatalog();
  const groups = useGroups();
  const policies = usePolicies();
  const staff = useStaffList();
  const refresh = useRefreshIam();
  const guard = useSelfGuard();
  const original = new Set<PermissionCode>(policy?.codes ?? []);
  const [selected, setSelected] = useState<Set<PermissionCode>>(original);
  const [name, setName] = useState(policy?.name ?? "");
  const [description, setDescription] = useState(policy?.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState<IamFailure | null>(null);
  const [confirming, setConfirming] = useState<"use" | "delete" | null>(null);
  const [saving, setSaving] = useState(false);
  const readOnly = policy?.system === "all";
  const nameChanged = policy !== null && name.trim() !== policy.name;
  const descriptionChanged = policy !== null && description.trim() !== (policy.description ?? "");
  const codeChanges = [...selected].filter((code) => !original.has(code)).length + [...original].filter((code) => !selected.has(code)).length;
  const changes = codeChanges + (nameChanged ? 1 : 0) + (descriptionChanged ? 1 : 0);
  const usedBy = policy ? [...(groups.data ?? []).filter((group) => group.policyIds.includes(policy.id)).map((group) => `กลุ่ม ${group.name}`), ...(staff.data ?? []).filter((member) => member.policyIds.includes(policy.id)).map((member) => member.displayName)] : [];

  async function write() {
    if (!catalog.data) return;
    setSaving(true);
    setFailure(null);
    setNameError(null);
    try {
      const codes = orderedCodes(catalog.data, selected);
      if (policy === null) await createPolicy({ name: name.trim(), description: description.trim() || undefined, codes });
      else {
        if (nameChanged || descriptionChanged) await updatePolicy(policy.id, { ...(nameChanged ? { name: name.trim() } : {}), ...(descriptionChanged ? { description: description.trim() } : {}) });
        if (codeChanges > 0) await setPolicyCodes(policy.id, codes);
      }
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
        <div className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-3 border-t border-line-hairline bg-surface p-3 md:left-auto" role="region" aria-label="บันทึกการแก้ไข">
          <span className="flex-1 text-body">{policy === null ? "นโยบายใหม่" : `แก้ไข ${changes} รายการ`}</span>
          <Button size="lg" variant="secondary" className="min-h-11" isDisabled={saving} onPress={() => (policy === null ? onBack() : (setSelected(new Set(original)), setName(policy.name), setDescription(policy.description ?? "")))}>
            ยกเลิก
          </Button>
          <Button size="lg" className="min-h-11" isDisabled={saving || name.trim() === "" || (policy !== null && changes === 0)} onPress={requestSave}>
            บันทึก
          </Button>
        </div>
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
