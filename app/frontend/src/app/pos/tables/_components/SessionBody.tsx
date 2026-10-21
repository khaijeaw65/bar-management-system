"use client";

import { Alert } from "@heroui/react";
import type { VisitDetail } from "@bar/contracts";
import { BillFooter } from "./BillFooter";
import { OrderGroup } from "./OrderGroup";
import { SessionHeader } from "./SessionHeader";
import type { SessionGroup } from "./session-groups";

export function SessionBody({
  titleId,
  visit,
  groups,
  paying,
  onClose,
  onCloseTable,
}: Readonly<{
  titleId: string;
  visit: VisitDetail;
  groups: SessionGroup[];
  paying: boolean;
  onClose: () => void;
  onCloseTable: () => void;
}>) {
  return (
    <>
      <SessionHeader titleId={titleId} visit={visit} onClose={onClose} />
      {paying ? (
        <Alert status="danger" role="alert">
          <Alert.Content>
            <Alert.Title>มีการชำระเงินค้างอยู่ ปิดโต๊ะไม่ได้</Alert.Title>
            <Alert.Description>รอให้การชำระเงินเสร็จก่อน แล้วลองอีกครั้ง</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col gap-1 py-6">
            <p>ยังไม่มีออเดอร์</p>
            <p className="text-small text-text-muted">ออเดอร์จาก QR ของโต๊ะจะขึ้นที่นี่ทันที</p>
          </div>
        ) : (
          groups.map((group) => <OrderGroup key={group.key} group={group} />)
        )}
      </div>
      <BillFooter bill={visit.bill} locked={paying} onCloseTable={onCloseTable} />
    </>
  );
}
