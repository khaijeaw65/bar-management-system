"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { Breadcrumbs, Button, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useMenuLive } from "@/hooks/useMenuLive";
import { getModifierGroups } from "@/lib/api/menu";
import { useDeleteGroup } from "../_hooks/useDeleteGroup";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { GroupEditor } from "./GroupEditor";
import { ModifierGroupList } from "./ModifierGroupList";

// `editing`: undefined = closed, null = a new group, else the group being edited.
export function ModifierGroupsScreen() {
  const groups = useQuery({ queryKey: ["menu", "modifier-groups"], queryFn: getModifierGroups, retry: false });
  const [editing, setEditing] = useState<ModifierGroupAdmin | null | undefined>(undefined);
  const removal = useDeleteGroup();
  useMenuLive();

  let body;
  if (groups.isPending) body = <Skeleton aria-busy="true" aria-label="กำลังโหลดกลุ่ม" className="h-40 w-full rounded-card" />;
  else if (groups.isError) body = <LoadError onRetry={() => void groups.refetch()} />;
  else if (groups.data.items.length === 0) body = <p className="text-text-muted">ยังไม่มีกลุ่ม</p>;
  else body = <ModifierGroupList groups={groups.data.items} onEdit={setEditing} onDelete={removal.ask} />;

  return (
    <section className="flex flex-col gap-4">
      <Breadcrumbs>
        <Breadcrumbs.Item>
          <Link href="/pos/menu">เมนู</Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>ตัวเลือกเสริม</Breadcrumbs.Item>
      </Breadcrumbs>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ตัวเลือกเสริม</h1>
        <Button onPress={() => setEditing(null)}>เพิ่มกลุ่ม</Button>
      </div>
      {body}
      {editing === undefined ? null : <GroupEditor group={editing ?? undefined} onClose={() => setEditing(undefined)} />}
      {removal.target ? (
        <DeleteGroupDialog group={removal.target} pending={removal.pending} failed={removal.failed} onConfirm={removal.confirm} onCancel={removal.cancel} />
      ) : null}
    </section>
  );
}
