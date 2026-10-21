"use client";

import { Table } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { getMenuCategories, getMenuItems } from "@/lib/api/menu";
import { MenuItemRow } from "./MenuItemRow";
import { MenuListError } from "./MenuListError";
import { MenuListSkeleton } from "./MenuListSkeleton";

export function MenuList() {
  const items = useQuery({
    queryKey: ["menu", "items"],
    queryFn: getMenuItems,
    retry: false,
  });
  const categories = useQuery({
    queryKey: ["menu", "categories"],
    queryFn: getMenuCategories,
    retry: false,
  });

  if (items.isPending || categories.isPending) return <MenuListSkeleton />;
  if (items.isError || categories.isError) {
    return (
      <MenuListError
        onRetry={() => {
          void items.refetch();
          void categories.refetch();
        }}
      />
    );
  }
  if (items.data.items.length === 0) {
    return <p className="text-text-muted">ยังไม่มีเมนู</p>;
  }

  const names = new Map(categories.data.items.map((category) => [category.id, category.name]));

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="รายการเมนู">
          <Table.Header>
            <Table.Column isRowHeader>ชื่อ</Table.Column>
            <Table.Column>หมวด</Table.Column>
            <Table.Column>ราคา</Table.Column>
            <Table.Column>สถานะ</Table.Column>
          </Table.Header>
          <Table.Body items={items.data.items}>
            {(item) => (
              <MenuItemRow item={item} categoryName={names.get(item.categoryId) ?? "ไม่มีหมวด"} />
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
