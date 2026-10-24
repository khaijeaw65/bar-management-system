"use client";

import { Modal } from "@heroui/react";
import type { VisitDetail } from "@bar/contracts";
import { useEffect, useRef } from "react";
import { CheckoutChoose } from "./CheckoutChoose";
import { ManualConfirm } from "./ManualConfirm";
import { PaymentResult } from "./PaymentResult";
import { PromptPayPending } from "./PromptPayPending";
import { useCheckout, type CheckoutController } from "./useCheckout";

function CheckoutBody({ checkout, onClose }: Readonly<{ checkout: CheckoutController; onClose: () => void }>) {
  const { phase, visit } = checkout;
  if (phase.name === "boot" || !visit) return <p>กำลังโหลด</p>;
  if (phase.name === "choose") {
    return (
      <CheckoutChoose
        visit={visit}
        method={phase.method}
        received={phase.received}
        fault={checkout.fault}
        pending={checkout.pending}
        onMethod={checkout.setMethod}
        onReceived={checkout.setReceived}
        onSubmit={checkout.submit}
        onClose={onClose}
      />
    );
  }
  if (phase.name === "pending" || phase.name === "expired") {
    return (
      <PromptPayPending
        payment={phase.payment}
        socketDown={checkout.socketDown}
        pending={checkout.pending}
        expired={phase.name === "expired"}
        fault={checkout.fault}
        onCancel={checkout.cancelQr}
        onManual={checkout.openManual}
        onNew={checkout.newQr}
        onVerified={checkout.slipPaid}
      />
    );
  }
  if (phase.name === "paid") return <PaymentResult payment={phase.payment} onSummary={onClose} />;
  return (
    <ManualConfirm
      reason={phase.reason}
      note={phase.note}
      fault={checkout.fault}
      pending={checkout.pending}
      onReason={checkout.setReason}
      onNote={checkout.setNote}
      onConfirm={checkout.confirmManual}
      onClose={checkout.back}
    />
  );
}

export function CheckoutModal({ visitId, onClose }: Readonly<{ visitId: string; onClose: () => void }>) {
  const checkout = useCheckout(visitId, onClose);
  const onCloseRef = useRef(onClose);
  const paid = checkout.phase.name === "paid";

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!paid) return;
    const id = setTimeout(() => onCloseRef.current(), 3000);
    return () => clearTimeout(id);
  }, [paid]);

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container>
        <Modal.Dialog className="w-full max-w-150" aria-label={titleOf(checkout.visit, checkout.phase.name)}>
          <CheckoutBody checkout={checkout} onClose={onClose} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function titleOf(visit: VisitDetail | undefined, phase: CheckoutController["phase"]["name"]): string {
  if (phase === "manual") return "ยืนยันด้วยตนเอง";
  if (phase === "paid") return "ชำระแล้ว";
  if (!visit) return "กำลังโหลด";
  return `ชำระเงิน — ${visit.seatLabel}`;
}
