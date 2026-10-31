"use client";

import type { Policy } from "@bar/contracts";
import { Button, Chip, Skeleton } from "@heroui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { usePolicies } from "@/hooks/useIamData";
import { PolicyEditor } from "./PolicyEditor";

type Editing = { policy: Policy | null } | null;

export function PoliciesScreen() {
  const policies = usePolicies();
  const [editing, setEditing] = useState<Editing>(null);

  if (editing) return <PolicyEditor key={editing.policy?.id ?? "new"} policy={editing.policy} onBack={() => setEditing(null)} />;
  if (policies.isPending) return <Skeleton aria-label="กำลังโหลด" className="h-40 w-full max-w-3xl rounded-card" />;
  if (policies.isError) return <LoadError onRetry={() => void policies.refetch()} />;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">นโยบายสิทธิ์</h1>
        <Button size="lg" className="min-h-11" onPress={() => setEditing({ policy: null })}>
          <Plus size={18} aria-hidden />
          สร้างนโยบาย
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {policies.data.map((policy) => (
          <li key={policy.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line-hairline bg-surface p-3">
            <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-body font-medium">{policy.name}</h2>
                {policy.system ? <Chip size="sm" variant="soft">ระบบ · ทุกสิทธิ์</Chip> : null}
              </div>
              <p className="text-small text-text-muted">
                {policy.codes.length} สิทธิ์ · ใช้อยู่ {policy.usage.groups} กลุ่ม · {policy.usage.people} คน
              </p>
            </div>
            <Button size="lg" variant="secondary" className="min-h-11" aria-label={`${policy.system ? "ดู" : "แก้ไข"} ${policy.name}`} onPress={() => setEditing({ policy })}>
              {policy.system ? "ดู" : "แก้ไข"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
