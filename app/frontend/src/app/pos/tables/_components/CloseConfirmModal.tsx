"use client";

import { Alert, Button, Modal } from "@heroui/react";
import type { Bill } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { hasMoney } from "./session-groups";

function Row({ label, value, accent }: Readonly<{ label: string; value: string; accent?: boolean }>) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={accent ? "text-text-danger tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

export function CloseConfirmModal({
  label,
  bill,
  pending,
  failed,
  onDismiss,
  onConfirm,
  onPay,
}: Readonly<{
  label: string;
  bill: Bill;
  pending: boolean;
  failed: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  onPay: () => void;
}>) {
  const owed = hasMoney(bill.remaining);

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.Heading className="text-heading">ปิดโต๊ะ {label}?</Modal.Heading>
          <dl className="flex flex-col gap-2">
            <Row label="ยอดรวม" value={formatTHB(bill.total)} />
            <Row label="ชำระแล้ว" value={formatTHB(bill.paid)} />
            <Row label="คงเหลือ" value={formatTHB(bill.remaining)} accent={owed} />
          </dl>
          {owed ? (
            <Alert status="danger" role="alert">
              <Alert.Content>
                <Alert.Description>ยังมียอดค้างชำระ {formatTHB(bill.remaining)}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
          {failed ? (
            <Alert status="danger" role="alert">
              <Alert.Content>
                <Alert.Description>ปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onPress={onDismiss}>
              ยกเลิก
            </Button>
            {owed ? (
              <Button className="flex-1" onPress={onPay}>
                ไปชำระเงิน
              </Button>
            ) : null}
            <Button className="flex-1" isDisabled={owed} isPending={pending} onPress={onConfirm}>
              ปิดโต๊ะ
            </Button>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
