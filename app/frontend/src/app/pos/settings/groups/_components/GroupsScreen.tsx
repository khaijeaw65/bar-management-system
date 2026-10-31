"use client";

import type { StaffGroup, StaffMember } from "@bar/contracts";
import { Button, Chip, Skeleton } from "@heroui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useGroups, usePolicies, useStaffList } from "@/hooks/useIamData";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { GroupFormDialog } from "./GroupFormDialog";

/** "สมาชิก n" counts live and future memberships only — the server's memberCount includes expired ones (audit 055 F3). */
export function memberCountOf(groupId: string, staff: StaffMember[]): number {
  return staff.filter((member) => member.memberships.some((row) => row.groupId === groupId && row.state !== "expired")).length;
}

type Dialog = { kind: "form"; group: StaffGroup | null } | { kind: "delete"; group: StaffGroup } | null;

export function GroupsScreen() {
  const groups = useGroups();
  const policies = usePolicies();
  const staff = useStaffList();
  const [dialog, setDialog] = useState<Dialog>(null);

  if (groups.isPending || policies.isPending) return <Skeleton aria-label="กำลังโหลด" className="h-40 w-full max-w-3xl rounded-card" />;
  if (groups.isError || policies.isError) return <LoadError onRetry={() => { void groups.refetch(); void policies.refetch(); }} />;

  const ordered = [...groups.data.filter((group) => group.system !== null), ...groups.data.filter((group) => group.system === null)];
  const policyName = (id: string) => policies.data.find((policy) => policy.id === id)?.name ?? "";

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">กลุ่มสิทธิ์</h1>
        <Button size="lg" className="min-h-11" onPress={() => setDialog({ kind: "form", group: null })}>
          <Plus size={18} aria-hidden />
          สร้างกลุ่ม
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {ordered.map((group) => (
          <li key={group.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line-hairline bg-surface p-3">
            <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-body font-medium">{group.name}</h2>
                {group.system ? <Chip size="sm" variant="soft">ค่าเริ่มต้น</Chip> : null}
                <span className="text-small text-text-muted">สมาชิก {staff.data ? memberCountOf(group.id, staff.data) : "–"}</span>
              </div>
              {group.description ? <p className="text-small text-text-muted">{group.description}</p> : null}
              <ul className="flex flex-wrap gap-1.5" aria-label={`นโยบายของ ${group.name}`}>
                {group.policyIds.map((id) => (
                  <li key={id}>
                    <Chip size="sm" variant="soft" color="accent">{policyName(id)}</Chip>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button size="lg" variant="secondary" className="min-h-11" aria-label={`${group.system === "owner" ? "ดู" : "แก้ไข"} ${group.name}`} onPress={() => setDialog({ kind: "form", group })}>
                {group.system === "owner" ? "ดู" : "แก้ไข"}
              </Button>
              {group.system === null ? (
                <Button size="lg" variant="danger-soft" className="min-h-11" aria-label={`ลบ ${group.name}`} onPress={() => setDialog({ kind: "delete", group })}>
                  ลบ
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {dialog?.kind === "form" ? <GroupFormDialog group={dialog.group} groups={groups.data} policies={policies.data} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === "delete" ? <DeleteGroupDialog group={dialog.group} groups={groups.data} onClose={() => setDialog(null)} /> : null}
    </div>
  );
}
