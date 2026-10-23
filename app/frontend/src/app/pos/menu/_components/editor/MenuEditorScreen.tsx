"use client";

import { Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/components/ui/LoadError";
import { getAdminMenuCategories, getMenuItem, getModifierGroups } from "@/lib/api/menu";
import { MenuEditor } from "./MenuEditor";

// `id` undefined = the new-item editor. The item is fetched fresh on every open (gcTime 0): its updatedAt is the stale guard.
export function MenuEditorScreen({ id }: Readonly<{ id?: string }>) {
  const item = useQuery({
    queryKey: ["menu", "item", id],
    queryFn: () => getMenuItem(id ?? ""),
    enabled: id !== undefined,
    gcTime: 0,
    retry: false,
  });
  const categories = useQuery({
    queryKey: ["menu", "categories", "admin"],
    queryFn: getAdminMenuCategories,
    retry: false,
  });
  const groups = useQuery({ queryKey: ["menu", "modifier-groups"], queryFn: getModifierGroups, retry: false });

  const failed = item.isError || categories.isError || groups.isError;
  if (failed) {
    return (
      <LoadError
        onRetry={() => {
          void item.refetch();
          void categories.refetch();
          void groups.refetch();
        }}
      />
    );
  }
  if ((id !== undefined && !item.data) || !categories.data || !groups.data) {
    return <Skeleton aria-busy="true" aria-label="กำลังโหลดเมนู" className="h-64 w-full rounded-card" />;
  }

  return <MenuEditor item={item.data} categories={categories.data.items} groups={groups.data.items} />;
}
