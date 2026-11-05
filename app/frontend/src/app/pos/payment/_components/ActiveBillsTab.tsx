"use client";

import { Button } from "@heroui/react";
import type { TableSummary, TodayPaymentItem } from "@bar/contracts";
import { Bell, CheckCircle2, CreditCard } from "lucide-react";
import { formatElapsed, useMinuteClock } from "@/app/pos/tables/_components/table-time";
import { formatTHB } from "@/lib/utils/format";
import { PendingQrCard } from "./PendingQrCard";

interface ActiveBillsTabProps {
  pendingQrTables: TableSummary[];
  activeUnpaidTables: TableSummary[];
  todayItems?: TodayPaymentItem[];
  onOpenCheckout: (visitId: string) => void;
}

export function ActiveBillsTab({
  pendingQrTables,
  activeUnpaidTables,
  todayItems,
  onOpenCheckout,
}: Readonly<ActiveBillsTabProps>) {
  const now = useMinuteClock();
  const hasTables = activeUnpaidTables.length > 0 || pendingQrTables.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {pendingQrTables.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-subhead font-semibold text-text-accent">
            กำลังรอเงินเข้า (PromptPay) — {pendingQrTables.length} โต๊ะ
          </h2>
          <div className="flex flex-col gap-2">
            {pendingQrTables.map((table) => (
              <PendingQrCard
                key={table.id}
                table={table}
                todayItems={todayItems}
                onOpenCheckout={onOpenCheckout}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-subhead font-semibold text-text-body">
          บิลเปิดรอคิดเงิน ({activeUnpaidTables.length})
        </h2>

        {!hasTables ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-line-hairline bg-surface-card p-12 text-center">
            <CheckCircle2 className="size-8 text-status-served" />
            <p className="text-body font-medium text-text-body">ไม่มีบิลค้างชำระ</p>
            <p className="text-small text-text-muted">ทุกโต๊ะเคลียร์ยอดเรียบร้อย</p>
          </div>
        ) : null}

        {activeUnpaidTables.length > 0 ? (
          <div className="overflow-x-auto rounded-card border border-line-hairline bg-surface-card">
            <table className="w-full text-left text-body">
              <thead className="border-b border-line-hairline bg-surface-raised text-small text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">โต๊ะ</th>
                  <th className="px-4 py-3 font-medium">ชื่อแขก</th>
                  <th className="px-4 py-3 font-medium">เวลาเปิด</th>
                  <th className="px-4 py-3 font-medium">รายการ</th>
                  <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
                  <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                  <th className="px-4 py-3 text-right font-medium">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-hairline">
                {activeUnpaidTables.map((table) => {
                  const visit = table.currentVisit;
                  if (!visit) return null;
                  const isBillCall = table.staffCall?.reason === "bill";
                  const elapsed = now === null ? "--:--" : `${formatElapsed(visit.openedAt, now)} ชม.`;

                  return (
                    <tr
                      key={table.id}
                      className="transition-colors hover:bg-surface-hover"
                    >
                      <td className="px-4 py-3 font-bold text-text-body">
                        {table.label}
                      </td>
                      <td className="px-4 py-3 text-small text-text-muted">
                        {visit.guestLabel || "-"}
                      </td>
                      <td className="px-4 py-3 text-small tabular-nums text-text-muted">
                        {elapsed}
                      </td>
                      <td className="px-4 py-3 text-small tabular-nums text-text-body">
                        {visit.itemCount} รายการ
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-accent">
                        {formatTHB(visit.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isBillCall ? (
                          <span className="inline-flex items-center gap-1 rounded-btn bg-accent-soft-strong px-2 py-0.5 text-micro font-medium text-text-accent">
                            <Bell className="size-3" />
                            ขอเช็คบิล
                          </span>
                        ) : (
                          <span className="text-micro text-text-faint">เปิดโต๊ะ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          className="bg-accent text-text-on-accent font-medium hover:bg-accent-hover"
                          onPress={() => onOpenCheckout(visit.id)}
                        >
                          <CreditCard className="size-4" />
                          ชำระเงิน
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
