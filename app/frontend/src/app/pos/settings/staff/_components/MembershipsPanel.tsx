"use client";

import type { MembershipInput, StaffGroup, StaffMember } from "@bar/contracts";
import { Alert, Button, Chip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { getStaffGroups, replaceMemberships, STAFF_GROUPS_KEY } from "@/lib/api/staff";
import { cn } from "@/lib/utils/cn";
import { AddGroupDialog } from "./AddGroupDialog";
import { chipText } from "./GroupChips";
import { currentSet } from "./membership";

/** Every change writes the whole set, rebuilt from the member the server last returned (no client-side merge drift). */
export function MembershipsPanel({ member }: Readonly<{ member: StaffMember }>) {
  const groups = useQuery({ queryKey: STAFF_GROUPS_KEY, queryFn: getStaffGroups, staleTime: 60_000, retry: false });
  const refresh = useRefreshIam();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const now = new Date();

  async function write(next: ReturnType<typeof currentSet>) {
    setSaving(true);
    setFailure(null);
    try {
      await replaceMemberships(member.id, next);
      setAdding(false);
    } catch (error) {
      setFailure(iamFailure(error).message);
    } finally {
      await refresh();
      setSaving(false);
    }
  }

  const remove = (groupId: string) => write(currentSet(member.memberships).filter((row) => row.groupId !== groupId));
  const add = (groupId: string, until: MembershipInput["until"]) =>
    write([...currentSet(member.memberships).filter((row) => row.groupId !== groupId), { groupId, until }]);

  return (
    <section aria-labelledby="memberships-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="memberships-heading" className="text-heading">กลุ่มสิทธิ์</h2>
        <Button size="lg" variant="secondary" className="min-h-11" onPress={() => setAdding(true)}>
          เพิ่มกลุ่ม
        </Button>
      </div>
      {failure ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Description>{failure}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {member.memberships.length === 0 ? <p className="text-body text-text-muted">ยังไม่มีกลุ่ม</p> : null}
      <ul className="flex flex-col gap-2">
        {member.memberships.map((membership) => (
          <li key={membership.groupId} className="flex items-center gap-3 rounded-card border border-line-hairline bg-surface p-3">
            <Chip size="sm" variant="soft" color={membership.state === "expired" ? "default" : "accent"} className={cn("flex-1", membership.state === "expired" && "line-through")}>
              {chipText(membership, now)}
            </Chip>
            <Button isIconOnly size="lg" variant="ghost" className="min-h-11 min-w-11" aria-label={`ลบกลุ่ม ${membership.groupName}`} isDisabled={saving} onPress={() => void remove(membership.groupId)}>
              <X size={18} aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      {adding ? (
        <AddGroupDialog member={member} groups={(groups.data ?? []) as StaffGroup[]} saving={saving} onClose={() => setAdding(false)} onAdd={(groupId, until) => void add(groupId, until)} />
      ) : null}
    </section>
  );
}
