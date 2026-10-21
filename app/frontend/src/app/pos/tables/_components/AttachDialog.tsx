"use client";

import { Button, Modal } from "@heroui/react";
import type { Visit } from "@bar/contracts";
import { formatThaiTime } from "./table-time";

function openerLabel(visit: Visit): string {
  if (visit.openedVia === "qr") return "ลูกค้า (สแกน QR)";
  return visit.openedBy?.displayName ?? "—";
}

export function AttachDialog({
  visit,
  onJoin,
  onPickOther,
}: Readonly<{
  visit: Visit;
  onJoin: () => void;
  onPickOther: () => void;
}>) {
  const guest = visit.guestLabel || "—";

  return (
    <>
      <header className="flex flex-col gap-1">
        <Modal.Heading className="text-heading">{visit.seatLabel} เพิ่งถูกเปิดไปแล้ว</Modal.Heading>
        <p className="text-small text-text-muted">
          ถ้าเป็นลูกค้ากลุ่มเดียวกัน ออเดอร์จะเข้าบิลเดียวกัน — ถ้าเป็นคนละกลุ่ม ให้เลือกโต๊ะอื่น
        </p>
      </header>
      <dl className="flex flex-col gap-2 text-body-md">
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">เปิดโดย</dt>
          <dd>{openerLabel(visit)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">เวลา</dt>
          <dd>{formatThaiTime(visit.openedAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-muted">แขก</dt>
          <dd>{guest}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2">
        <Button size="lg" onPress={onJoin}>
          เข้าโต๊ะเดิม ({guest})
        </Button>
        <Button size="lg" variant="secondary" onPress={onPickOther}>
          เลือกโต๊ะอื่น
        </Button>
      </div>
    </>
  );
}
