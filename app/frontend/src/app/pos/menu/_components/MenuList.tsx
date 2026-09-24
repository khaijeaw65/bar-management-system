"use client";

import { Table } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { getMenuItems } from "@/lib/api/menu";
import { MenuItemRow } from "./MenuItemRow";
import { MenuListError } from "./MenuListError";
import { MenuListSkeleton } from "./MenuListSkeleton";

export function MenuList() {
  const query = useQuery({
    queryKey: ["menu", "items"],
    queryFn: getMenuItems,
    retry: false,
  });

  if (query.isPending) return <MenuListSkeleton />;
  if (query.isError) return <MenuListError onRetry={() => void query.refetch()} />;
  if (query.data.items.length === 0) {
    return <p className="text-text-secondary">ยังไม่มีเมนู</p>;
  }

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
          <Table.Body items={query.data.items}>
            {(item) => <MenuItemRow item={item} />}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
