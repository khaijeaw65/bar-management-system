import type { ReportDay } from "@bar/contracts";
import { Table } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";
import { formatShortDate } from "../period";

export function DailyTable({ days }: Readonly<{ days: ReportDay[] }>) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="ยอดขายรายวัน">
          <Table.Header>
            <Table.Column isRowHeader>วันที่</Table.Column>
            <Table.Column className="text-right">ยอดขาย</Table.Column>
            <Table.Column className="text-right">บิล</Table.Column>
          </Table.Header>
          <Table.Body>
            {days.map((day) => (
              <Table.Row key={day.date} id={day.date}>
                <Table.Cell>{formatShortDate(day.date)}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{formatTHB(day.revenue)}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{day.bills}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
