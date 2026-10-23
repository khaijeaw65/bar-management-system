"use client";

import type { MenuCategory, MenuCategoryList } from "@bar/contracts";
import { toast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMenuCategory,
  deleteMenuCategory,
  getAdminMenuCategories,
  reorderMenuCategories,
  updateMenuCategory,
} from "@/lib/api/menu";

const KEY = ["menu", "categories", "admin"];

// Reorder and hide apply at once; a failed call puts the list back and says so (BRIEF-045 Selected 6).
export function useCategories() {
  const client = useQueryClient();
  const list = useQuery({ queryKey: KEY, queryFn: getAdminMenuCategories, retry: false });
  const settle = () => client.invalidateQueries({ queryKey: ["menu"] });

  const optimistic = async (change: (items: MenuCategory[]) => MenuCategory[]) => {
    await client.cancelQueries({ queryKey: KEY });
    const snapshot = client.getQueryData<MenuCategoryList>(KEY);
    if (snapshot) client.setQueryData<MenuCategoryList>(KEY, { items: change(snapshot.items) });
    return { snapshot };
  };
  const revert = (context: { snapshot: MenuCategoryList | undefined } | undefined) => {
    if (context?.snapshot) client.setQueryData(KEY, context.snapshot);
  };

  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderMenuCategories(ids),
    onMutate: (ids) =>
      optimistic((items) => ids.flatMap((id) => items.filter((category) => category.id === id))),
    onError: (_error, _ids, context) => {
      revert(context);
      toast.danger("เรียงหมวดไม่สำเร็จ — ลองอีกครั้ง");
    },
    onSettled: settle,
  });
  const visibility = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => updateMenuCategory(input.id, { isActive: input.isActive }),
    onMutate: (input) =>
      optimistic((items) => items.map((c) => (c.id === input.id ? { ...c, isActive: input.isActive } : c))),
    onError: (_error, _input, context) => {
      revert(context);
      toast.danger("เปลี่ยนการแสดงหมวดไม่สำเร็จ — ลองอีกครั้ง");
    },
    onSettled: settle,
  });
  const create = useMutation({ mutationFn: createMenuCategory, onSettled: settle });
  const rename = useMutation({
    mutationFn: (input: { id: string; name: string }) => updateMenuCategory(input.id, { name: input.name }),
    onSettled: settle,
  });
  const remove = useMutation({ mutationFn: deleteMenuCategory, onSettled: settle });

  return {
    list,
    reorder: (ids: string[]) => reorder.mutate(ids),
    setActive: (id: string, isActive: boolean) => visibility.mutate({ id, isActive }),
    create: (name: string) => create.mutateAsync(name),
    rename: (id: string, name: string) => rename.mutateAsync({ id, name }),
    remove: (id: string) => remove.mutateAsync(id),
  };
}

// Moves `id` to `target` (before it, or after when `after`) in a full id list.
export function movedIds(ids: string[], id: string, target: string, after: boolean): string[] {
  const rest = ids.filter((value) => value !== id);
  const at = rest.indexOf(target) + (after ? 1 : 0);
  return [...rest.slice(0, at), id, ...rest.slice(at)];
}
