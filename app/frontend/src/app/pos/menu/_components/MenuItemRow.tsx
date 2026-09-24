import { Chip, Table } from "@heroui/react";
import type { MenuItem } from "@/lib/api/menu";
import { formatTHB } from "@/lib/utils/format";

export function MenuItemRow({ item }: { item: MenuItem }) {
  const available = item.isAvailable;

  return (
    <Table.Row id={item.id}>
      <Table.Cell className={available ? undefined : "text-text-disabled line-through"}>
        {item.name}
      </Table.Cell>
      <Table.Cell className="text-text-secondary">{item.category}</Table.Cell>
      <Table.Cell className="text-accent-text">{formatTHB(item.price)}</Table.Cell>
      <Table.Cell>
        <Chip
          size="sm"
          className={
            available
              ? "bg-success-subtle text-success"
              : "bg-error-subtle text-error"
          }
        >
          {available ? "พร้อมขาย" : "หมด"}
        </Chip>
      </Table.Cell>
    </Table.Row>
  );
}
