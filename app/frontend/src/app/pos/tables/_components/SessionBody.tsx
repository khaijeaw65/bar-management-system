"use client";

import { Alert, Button } from "@heroui/react";
import type { OrderLine, VisitDetail } from "@bar/contracts";
import { usePermissions } from "@/lib/permissions/usePermissions";
import { pendingPayment } from "./checkout/payment";
import { BillFooter } from "./BillFooter";
import { OrderEntryButton } from "./OrderEntryButton";
import { OrderGroup } from "./OrderGroup";
import { SessionCallRow } from "./SessionCallRow";
import { SessionHeader } from "./SessionHeader";
import { hasMoney, splitLate, type SessionGroup } from "./session-groups";

export function SessionBody({
  titleId,
  visit,
  groups,
  paying,
  onClose,
  onPay,
  onCloseTable,
  onAdjust,
}: Readonly<{
  titleId: string;
  visit: VisitDetail;
  groups: SessionGroup[];
  paying: boolean;
  onClose: () => void;
  onPay: () => void;
  onCloseTable: () => void;
  onAdjust?: (line: OrderLine) => void;
}>) {
  const { can } = usePermissions();
  const settled = !paying && !hasMoney(visit.bill.remaining) && hasMoney(visit.bill.paid);
  const late = splitLate(groups, paying ? pendingPayment(visit)?.createdAt ?? null : null);
  return (
    <>
      <SessionCallRow seatId={visit.tableSeatId} label={visit.seatLabel} />
      <SessionHeader titleId={titleId} visit={visit} hasOrders={groups.length > 0} onClose={onClose} />
      {paying ? <InFlight canPay={can("payments:create")} onPay={onPay} /> : null}
      {settled ? <Settled /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <EmptyOrders visitId={visit.id} />
        ) : (
          <OrderList
            locked={late.locked}
            late={late.late}
            onAdjust={onAdjust}
            disabled={paying}
          />
        )}
      </div>
      <BillFooter bill={visit.bill} locked={paying} canPay={can("payments:create")} canClose={can("visits:close")} onPay={onPay} onCloseTable={onCloseTable} />
    </>
  );
}

function InFlight({ canPay, onPay }: Readonly<{ canPay: boolean; onPay: () => void }>) {
  return (
    <Alert status="warning" role="alert">
      <Alert.Content>
        <Alert.Title>มีการชำระเงินค้างอยู่</Alert.Title>
        {canPay ? <Button size="sm" variant="secondary" onPress={onPay}>ดู QR</Button> : null}
      </Alert.Content>
    </Alert>
  );
}

function Settled() {
  return (
    <Alert status="success" role="alert">
      <Alert.Content>
        <Alert.Description>ชำระครบแล้ว</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

function EmptyOrders({ visitId }: Readonly<{ visitId: string }>) {
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <div className="flex flex-col gap-1">
        <p>ยังไม่มีออเดอร์</p>
        <p className="text-small text-text-muted">ออเดอร์จาก QR ของโต๊ะจะขึ้นที่นี่ทันที</p>
      </div>
      <OrderEntryButton visitId={visitId} prominent />
    </div>
  );
}

function OrderList({
  locked,
  late,
  onAdjust,
  disabled,
}: Readonly<{
  locked: SessionGroup[];
  late: SessionGroup[];
  onAdjust?: (line: OrderLine) => void;
  disabled?: boolean;
}>) {
  return (
    <>
      {locked.map((group) => (
        <OrderGroup
          key={group.key}
          group={group}
          onAdjust={onAdjust}
          disabled={disabled}
        />
      ))}
      {late.length > 0 ? <p className="text-small text-text-muted">ออเดอร์ใหม่หลังสร้าง QR — ไม่รวมในยอดนี้</p> : null}
      {late.map((group) => (
        <OrderGroup
          key={group.key}
          group={group}
          onAdjust={onAdjust}
          disabled={disabled}
        />
      ))}
    </>
  );
}
