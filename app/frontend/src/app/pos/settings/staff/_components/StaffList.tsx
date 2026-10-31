"use client";

import { Alert, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useMe } from "@/hooks/useMe";
import { getStaffList, STAFF_KEY } from "@/lib/api/staff";
import { cn } from "@/lib/utils/cn";
import { ActiveSwitch } from "./ActiveSwitch";
import { GroupChips } from "./GroupChips";
import { StaffAvatar } from "./StaffAvatar";

export function StaffList({ highlightId }: Readonly<{ highlightId: string | null }>) {
  const staff = useQuery({ queryKey: STAFF_KEY, queryFn: getStaffList, retry: false });
  const me = useMe();
  const [alert, setAlert] = useState<string | null>(null);

  return (
    <section aria-labelledby="staff-heading" className="flex flex-col gap-3">
      <h2 id="staff-heading" className="text-heading">พนักงาน</h2>
      {alert ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Description>{alert}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {staff.isPending ? <Skeleton className="h-16 w-full rounded-card" /> : null}
      {staff.isError ? <LoadError onRetry={() => void staff.refetch()} /> : null}
      <ul className="flex flex-col gap-2">
        {staff.data?.map((member) => (
          <li
            key={member.id}
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-card border bg-surface p-3",
              member.id === highlightId ? "border-accent bg-accent-soft" : "border-line-hairline",
            )}
          >
            <StaffAvatar name={member.displayName} url={member.avatarUrl} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link href={`/pos/settings/staff/${member.id}`} className="min-h-11 content-center truncate text-body font-medium underline-offset-2 hover:underline">
                {member.displayName}
              </Link>
              <GroupChips memberships={member.memberships} dimmed={!member.isActive} />
            </div>
            <div className="flex items-center gap-2">
              <ActiveSwitch member={member} isSelf={member.id === me.data?.id} onFailure={setAlert} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
