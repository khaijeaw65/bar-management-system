"use client";

import { Button, Input, Skeleton, toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { useMe } from "@/hooks/useMe";
import { ApiError } from "@/lib/api/errors";
import { getStaffMember, updateStaff } from "@/lib/api/staff";
import { ActiveSwitch } from "./ActiveSwitch";
import { EffectivePermissionsPanel } from "./EffectivePermissionsPanel";
import { MembershipsPanel } from "./MembershipsPanel";
import { PersonalPoliciesPanel } from "./PersonalPoliciesPanel";
import { StaffAvatar } from "./StaffAvatar";

function RenameField({ id, name }: Readonly<{ id: string; name: string }>) {
  const refresh = useRefreshIam();
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const trimmed = draft.trim();
  const changed = trimmed !== name && trimmed !== "" && trimmed.length <= 200;

  async function save() {
    setSaving(true);
    try {
      await updateStaff(id, { displayName: trimmed });
      toast.success("เปลี่ยนชื่อแล้ว");
    } catch (error) {
      toast.danger(iamFailure(error).message);
    } finally {
      await refresh();
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 basis-48 items-center gap-2">
      <Input aria-label="ชื่อที่แสดง" value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-11 min-w-0 flex-1" />
      <Button size="lg" className="min-h-11" isDisabled={!changed || saving} onPress={() => void save()}>
        บันทึกชื่อ
      </Button>
    </div>
  );
}

export function StaffDetailScreen({ staffId }: Readonly<{ staffId: string }>) {
  const member = useQuery({ queryKey: ["staff", "member", staffId], queryFn: () => getStaffMember(staffId), retry: false });
  const me = useMe();

  if (member.isPending) return <Skeleton aria-label="กำลังโหลด" className="h-40 w-full max-w-3xl rounded-card" />;
  if (member.isError) {
    const missing = member.error instanceof ApiError && member.error.status === 404;
    return <LoadError title={missing ? "ไม่พบพนักงาน" : undefined} onRetry={() => void member.refetch()} />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/pos/settings/staff" className="flex min-h-11 items-center gap-1 text-small text-text-muted">
        <ArrowLeft size={16} aria-hidden />
        พนักงานทั้งหมด
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <StaffAvatar name={member.data.displayName} url={member.data.avatarUrl} />
        <h1 className="sr-only">{member.data.displayName}</h1>
        <RenameField key={member.data.displayName} id={member.data.id} name={member.data.displayName} />
        <ActiveSwitch member={member.data} isSelf={member.data.id === me.data?.id} />
      </header>
      <MembershipsPanel member={member.data} />
      <PersonalPoliciesPanel member={member.data} />
      <EffectivePermissionsPanel staffId={staffId} />
    </div>
  );
}
