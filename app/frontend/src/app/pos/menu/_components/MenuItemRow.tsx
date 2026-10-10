import { Chip, Table } from "@heroui/react";
import type { MenuItem } from "@/lib/api/menu";
import { formatTHB } from "@/lib/utils/format";

export function MenuItemRow({ item }: Readonly<{ item: MenuItem }>) {
  const available = item.isAvailable;

  return (
    <Table.Row id={item.id}>
      <Table.Cell className={available ? undefined : "text-text-faint line-through"}>
        {item.name}
      </Table.Cell>
      <Table.Cell className="text-text-muted">{item.category}</Table.Cell>
      <Table.Cell className="text-text-accent tabular-nums">{formatTHB(item.price)}</Table.Cell>
      <Table.Cell>
        <Chip
          size="sm"
          className={
            available
              ? "bg-status-served-bg text-status-served-fg"
              : "bg-status-void-bg text-status-void-fg"
          }
        >
          {available ? "พร้อมขาย" : "หมด"}
        </Chip>
      </Table.Cell>
    </Table.Row>
  );
}
