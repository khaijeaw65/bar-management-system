"use client";

import { Button } from "@heroui/react";
import type { TodayPaymentItem } from "@bar/contracts";
import { Banknote, QrCode } from "lucide-react";
import { useState } from "react";
import { formatThaiTime } from "@/app/pos/tables/_components/table-time";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { confirmLabel, StatusBadge } from "./PaymentStatusBadge";

type FilterMethod = "all" | "promptpay" | "cash";

interface PaymentHistoryTabProps {
  items: TodayPaymentItem[];
}

export function PaymentHistoryTab({ items }: Readonly<PaymentHistoryTabProps>) {
  const [filter, setFilter] = useState<FilterMethod>("all");

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.method === filter;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FilterChip
          active={filter === "all"}
          label="ทั้งหมด"
          count={items.length}
          onSelect={() => setFilter("all")}
        />
        <FilterChip
          active={filter === "promptpay"}
          label="PromptPay"
          count={items.filter((i) => i.method === "promptpay").length}
          onSelect={() => setFilter("promptpay")}
        />
        <FilterChip
          active={filter === "cash"}
          label="เงินสด"
          count={items.filter((i) => i.method === "cash").length}
          onSelect={() => setFilter("cash")}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-line-hairline bg-surface-card p-12 text-center text-text-muted">
          <p className="text-body font-medium text-text-body">
            ยังไม่มีรายการชำระเงินในรอบวันธุรกิจนี้
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line-hairline bg-surface-card">
          <table className="w-full text-left text-body">
            <thead className="border-b border-line-hairline bg-surface-raised text-small text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">เวลา</th>
                <th className="px-4 py-3 font-medium">โต๊ะ</th>
                <th className="px-4 py-3 text-right font-medium">ยอดเงิน</th>
                <th className="px-4 py-3 font-medium">ช่องทาง</th>
                <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">การยืนยัน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-hairline">
              {filteredItems.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-4 py-3 text-small tabular-nums text-text-muted">
                    {formatThaiTime(item.paidAt ?? item.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-bold text-text-body">
                    {item.seatLabel}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-body">
                    {formatTHB(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-small text-text-body">
                    {item.method === "promptpay" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <QrCode className="size-3.5 text-text-accent" />
                        PromptPay
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Banknote className="size-3.5 text-status-served" />
                        เงินสด
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-small text-text-muted">
                    {confirmLabel(item.confirmedVia)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  count,
  onSelect,
}: Readonly<{
  active: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}>) {
  return (
    <Button
      size="sm"
      variant={active ? "primary" : "secondary"}
      className={cn(
        "rounded-btn text-small",
        active
          ? "bg-accent text-text-on-accent font-semibold"
          : "bg-surface-raised text-text-muted hover:bg-surface-hover",
      )}
      onPress={onSelect}
    >
      {label} ({count})
    </Button>
  );
}
