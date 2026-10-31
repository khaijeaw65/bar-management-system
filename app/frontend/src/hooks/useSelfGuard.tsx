"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getPolicies, POLICIES_KEY } from "@/lib/api/iam";
import { getStaffGroups, getStaffMember, STAFF_GROUPS_KEY } from "@/lib/api/staff";
import { losesStaffManage, type IamChange } from "@/lib/permissions/selfImpact";
import { useMe } from "./useMe";

export const SELF_IMPACT_COPY = "คุณจะไม่สามารถจัดการสิทธิ์ได้อีก";

/** CD-13 D4 (BRIEF-058): warn — never block — before a write that takes the current user's own staff:manage away. */
export function useSelfGuard(): { run: (change: IamChange, action: () => void) => void; dialog: ReactNode } {
  const me = useMe().data?.id;
  const member = useQuery({ queryKey: ["staff", "member", me], queryFn: () => getStaffMember(me ?? ""), enabled: me !== undefined, retry: false });
  const groups = useQuery({ queryKey: STAFF_GROUPS_KEY, queryFn: getStaffGroups, staleTime: 60_000, retry: false });
  const policies = useQuery({ queryKey: POLICIES_KEY, queryFn: getPolicies, staleTime: 60_000, retry: false });
  const [pending, setPending] = useState<(() => void) | null>(null);

  function run(change: IamChange, action: () => void) {
    if (!member.data || !groups.data || !policies.data) return action();
    const world = { member: member.data, groups: groups.data, policies: policies.data };
    if (losesStaffManage(world, change)) setPending(() => action);
    else action();
  }

  const dialog = pending ? (
    <ConfirmDialog
      title={SELF_IMPACT_COPY}
      confirmLabel="ทำต่อ"
      danger
      onCancel={() => setPending(null)}
      onConfirm={() => {
        pending();
        setPending(null);
      }}
    >
      <p className="text-body text-text-muted">การเปลี่ยนนี้ทำให้บัญชีของคุณไม่มีสิทธิ์จัดการพนักงานและสิทธิ์</p>
    </ConfirmDialog>
  ) : null;

  return { run, dialog };
}
