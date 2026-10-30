"use client";

import { Button, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { CallStaffSheet } from "../../_components/CallStaffSheet";
import { useCallStaff } from "../../_hooks/useCallStaff";
import { useCustomerPayment } from "../../_hooks/useCustomerPayment";
import { useGuestSession } from "../../_hooks/useGuestSession";
import { usePayActions } from "../../_hooks/usePayActions";
import { ExpiredView } from "./ExpiredView";
import { IntentView } from "./IntentView";
import { PaidView } from "./PaidView";
import { QrView } from "./QrView";

export function PayScreen() {
  const router = useRouter();
  const payment = useCustomerPayment();
  const seat = useGuestSession().query.data?.seat.label ?? "";
  const actions = usePayActions();
  const call = useCallStaff();
  // Whether this phone is looking at the QR: it decides what an empty `pending` means (cancelled, expired or paid).
  const [watching, setWatching] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const toBill = () => router.push("/customer/tab");

  if (payment.isError && !payment.data) {
    return (
      <div className="p-4">
        <LoadError onRetry={() => void payment.refetch()} />
      </div>
    );
  }
  if (!payment.data) return <Skeleton aria-busy className="m-4 h-40 rounded-card" />;
  const { bill, pending } = payment.data;
  const create = () => {
    setWatching(true);
    actions.create.mutate();
  };

  if (watching && pending) {
    const changeMethod = () => {
      // Leave the QR only once the server says it is cancelled, so the intent never flashes "ดู QR" for a payment that is going away.
      actions.cancel.mutate(pending.id, { onSuccess: () => setWatching(false) });
    };
    return <QrView pending={pending} seat={seat} actions={actions} onChangeMethod={changeMethod} />;
  }
  if (watching && actions.create.isPending) return <Skeleton aria-busy className="m-4 h-40 rounded-card" />;
  if (bill.remaining === "0.00") return bill.paid === "0.00" ? <NothingToPay onBack={toBill} /> : <PaidView onBack={toBill} />;
  if (watching) return <ExpiredView onRenew={create} busy={actions.create.isPending} />;
  return (
    <>
      <IntentView
        payment={payment.data}
        busy={actions.create.isPending}
        failed={actions.create.isError && !actions.create.isPending && actions.failed}
        onCreate={create}
        onView={() => setWatching(true)}
        onCash={() => setCashOpen(true)}
      />
      {cashOpen ? <CallStaffSheet call={call} initialReason="bill" onClose={() => setCashOpen(false)} /> : null}
    </>
  );
}

function NothingToPay({ onBack }: Readonly<{ onBack: () => void }>) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-text-muted">ยังไม่มียอดที่ต้องชำระ</p>
      <Button size="lg" variant="secondary" onPress={onBack}>
        กลับไปที่บิล
      </Button>
    </div>
  );
}
