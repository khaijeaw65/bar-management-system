"use client";

import { Button, Card } from "@heroui/react";
import type { TableSummary, TodayPaymentItem } from "@bar/contracts";
import { QrCode } from "lucide-react";
import { formatTHB } from "@/lib/utils/format";
import { useQrClock } from "@/app/pos/tables/_components/checkout/useQrClock";

interface PendingQrCardProps {
  table: TableSummary;
  todayItems?: TodayPaymentItem[];
  onOpenCheckout: (visitId: string) => void;
}

export function PendingQrCard({
  table,
  todayItems,
  onOpenCheckout,
}: Readonly<PendingQrCardProps>) {
  const visit = table.currentVisit;
  const pendingPayment = todayItems?.find(
    (item) => item.visitId === visit?.id && item.status === "pending",
  );
  const expiresAt = pendingPayment
    ? new Date(Date.parse(pendingPayment.createdAt) + 15 * 60_000).toISOString()
    : visit
      ? new Date(Date.parse(visit.openedAt) + 15 * 60_000).toISOString()
      : null;

  const { clock } = useQrClock(expiresAt);

  if (!visit) return null;

  return (
    <Card className="border-line-accent bg-accent-soft">
      <Card.Content className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-accent" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-subhead font-bold text-text-body">{table.label}</span>
              {visit.guestLabel ? (
                <span className="text-small text-text-muted">({visit.guestLabel})</span>
              ) : null}
            </div>
            <span className="text-small text-text-accent font-medium">
              กำลังรอชำระเงิน PromptPay QR · {visit.itemCount} รายการ
              {clock !== "00:00" ? ` · เหลือเวลา ${clock}` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="text-price font-bold tabular-nums text-text-body">
            {formatTHB(visit.total)}
          </span>
          <Button
            size="sm"
            className="bg-accent text-text-on-accent font-medium hover:bg-accent-hover"
            onPress={() => onOpenCheckout(visit.id)}
          >
            <QrCode className="size-4" />
            ดู QR / จัดการ
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
