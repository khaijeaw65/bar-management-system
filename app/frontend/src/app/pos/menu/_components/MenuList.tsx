"use client";

import { Table } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { useMenuLive } from "@/hooks/useMenuLive";
import { useMenuList } from "../_hooks/useMenuList";
import { MenuEmpty } from "./MenuEmpty";
import { MenuItemRow } from "./MenuItemRow";
import { MenuListError } from "./MenuListError";
import { MenuListSkeleton } from "./MenuListSkeleton";
import { MenuToolbar } from "./MenuToolbar";

export function MenuList() {
  const list = useMenuList();
  const highlight = useSearchParams().get("highlight");
  useMenuLive();

  if (list.items.isPending || list.categories.isPending) return <MenuListSkeleton />;
  if (list.items.isError || list.categories.isError) return <MenuListError onRetry={list.refetch} />;

  const categories = list.categories.data.items;
  const byId = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="flex flex-col gap-4">
      <MenuToolbar
        categories={categories}
        query={list.query}
        categoryId={list.categoryId}
        onQuery={list.setQuery}
        onCategory={list.setCategoryId}
      />
      {list.visible.length === 0 ? (
        <MenuEmpty noItems={list.items.data.items.length === 0} />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="รายการเมนู">
              <Table.Header>
                <Table.Column isRowHeader>ชื่อ</Table.Column>
                <Table.Column>หมวด</Table.Column>
                <Table.Column>ส่งไปที่</Table.Column>
                <Table.Column>ราคา</Table.Column>
                <Table.Column>สถานะ</Table.Column>
              </Table.Header>
              <Table.Body items={list.visible}>
                {(item) => (
                  <MenuItemRow
                    item={item}
                    categoryName={byId.get(item.categoryId)?.name ?? "ไม่มีหมวด"}
                    categoryHidden={byId.get(item.categoryId)?.isActive === false}
                    highlighted={item.id === highlight}
                  />
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </div>
  );
}
