"use client";

import type { EffectivePermissions } from "@bar/contracts";
import { Chip, Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/ui/LoadError";
import { getEffectivePermissions, getPermissionCatalog, PERMISSION_CATALOG_KEY } from "@/lib/api/staff";

type Source = EffectivePermissions["permissions"][number]["sources"][number];

export function sourceText(source: Source): string {
  return source.kind === "group" ? `กลุ่ม ${source.groupName ?? ""} · นโยบาย ${source.policyName}` : `ส่วนตัว · นโยบาย ${source.policyName}`;
}

/** What the person can do now and why — personal policies are edited in PersonalPoliciesPanel. */
export function EffectivePermissionsPanel({ staffId }: Readonly<{ staffId: string }>) {
  const effective = useQuery({ queryKey: ["staff", "effective", staffId], queryFn: () => getEffectivePermissions(staffId), retry: false });
  const catalog = useQuery({ queryKey: PERMISSION_CATALOG_KEY, queryFn: getPermissionCatalog, staleTime: 5 * 60_000, retry: false });

  if (effective.isPending || catalog.isPending) return <Skeleton aria-label="กำลังโหลดสิทธิ์" className="h-40 w-full rounded-card" />;
  if (effective.isError || catalog.isError) {
    return <LoadError onRetry={() => { void effective.refetch(); void catalog.refetch(); }} />;
  }

  const sources = new Map(effective.data.permissions.map((row) => [row.code, row.sources]));
  const rows = catalog.data
    .map((resource) => ({ ...resource, actions: resource.actions.filter((action) => sources.has(action.code)) }))
    .filter((resource) => resource.actions.length > 0);

  return (
    <section aria-labelledby="effective-heading" className="flex flex-col gap-3">
      <h2 id="effective-heading" className="text-heading">สิทธิ์ที่มีตอนนี้</h2>
      {rows.length === 0 ? <p className="text-body text-text-muted">ยังไม่มีสิทธิ์ใด ๆ</p> : null}
      {rows.map((resource) => (
        <div key={resource.resource} className="flex flex-col gap-2 rounded-card border border-line-hairline bg-surface p-3">
          <h3 className="text-label text-text-muted">{resource.label}</h3>
          <ul className="flex flex-col gap-2">
            {resource.actions.map((action) => (
              <li key={action.code} className="flex flex-col gap-1">
                <span className="text-body">{action.label}</span>
                <span className="flex flex-wrap gap-1.5">
                  {(sources.get(action.code) ?? []).map((source) => (
                    <Chip key={sourceText(source)} size="sm" variant="soft">
                      {sourceText(source)}
                    </Chip>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
