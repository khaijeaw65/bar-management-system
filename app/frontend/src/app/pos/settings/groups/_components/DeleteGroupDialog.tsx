"use client";

import type { StaffGroup } from "@bar/contracts";
import { Skeleton, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCatalog } from "@/hooks/useIamData";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { useSelfGuard } from "@/hooks/useSelfGuard";
import { deleteGroup, getDeleteImpact } from "@/lib/api/iam";
import { labelsOf } from "@/lib/permissions/catalog";
import { FailureAlert } from "./FailureAlert";

/** CD-13 groups·4: who is in the group and exactly what each person would lose. */
export function DeleteGroupDialog({ group, groups, onClose }: Readonly<{ group: StaffGroup; groups: StaffGroup[]; onClose: () => void }>) {
  const refresh = useRefreshIam();
  const guard = useSelfGuard();
  const impact = useQuery({ queryKey: ["staff", "delete-impact", group.id], queryFn: () => getDeleteImpact(group.id), retry: false, gcTime: 0 });
  const catalog = useCatalog();
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const labels = labelsOf(catalog.data ?? []);

  async function remove() {
    setSaving(true);
    setFailure(null);
    try {
      await deleteGroup(group.id);
      toast.success(`ลบกลุ่ม ${group.name} แล้ว · มีผลทันที`);
      await refresh();
      onClose();
    } catch (error) {
      setFailure(iamFailure(error).message);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  const members = impact.data?.members ?? [];
  return (
    <>
      <ConfirmDialog
        title={`ลบกลุ่ม ${group.name}?`}
        confirmLabel="ลบกลุ่ม"
        danger
        busy={saving || !impact.isSuccess}
        onCancel={onClose}
        onConfirm={() => guard.run({ groups: groups.filter((item) => item.id !== group.id) }, () => void remove())}
      >
        {impact.isPending ? <Skeleton aria-label="กำลังโหลด" className="h-16 w-full rounded-card" /> : null}
        {impact.isError ? <p role="alert" className="text-small text-text-danger">โหลดผลกระทบไม่สำเร็จ</p> : null}
        {impact.isSuccess && members.length === 0 ? <p className="text-body text-text-muted">ไม่มีใครเสียสิทธิ์</p> : null}
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li key={member.staffId} className="flex flex-col gap-1 rounded-card border border-line-hairline bg-surface p-3">
              <span className="text-body font-medium">{member.displayName}</span>
              <span className="text-small text-text-muted">
                {member.losing.length === 0 ? "ไม่เสียสิทธิ์" : `จะเสีย: ${member.losing.map((code) => labels.get(code) ?? code).join(", ")}`}
              </span>
            </li>
          ))}
        </ul>
        <FailureAlert message={failure} />
      </ConfirmDialog>
      {guard.dialog}
    </>
  );
}
