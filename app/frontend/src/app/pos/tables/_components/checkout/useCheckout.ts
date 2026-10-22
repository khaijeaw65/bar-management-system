"use client";

import { toast } from "@heroui/react";
import type { ManualConfirmReason, Payment, PaymentAttempt, PaymentMethod } from "@bar/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { cancelPayment, createPayment, getPayment, markPaymentPaid } from "@/lib/api/payments";
import { getVisit } from "@/lib/api/visits";
import { bootPhase, checkoutPhase } from "./checkout-phase";
import { cashShort, pendingPayment, readAttempt } from "./payment";
import { usePaymentStatus } from "./usePaymentStatus";

export type CheckoutFault = "promptpay" | "network" | "failed" | null;

function faultOf(error: unknown): CheckoutFault {
  if (!(error instanceof ApiError) || error.status === 0 || error.code === "NETWORK_ERROR") return "network";
  if (error.code === "PROMPTPAY_NOT_SET") return "promptpay";
  return "failed";
}

function samePayment(left: Payment, right: Payment): boolean {
  return left.status === right.status && left.statusReason === right.statusReason && left.confirmedVia === right.confirmedVia;
}

export function useCheckout(visitId: string, onDone: () => void) {
  const client = useQueryClient();
  const visit = useQuery({ queryKey: ["visits", visitId], queryFn: () => getVisit(visitId), retry: false });
  const [phase, dispatch] = useReducer(checkoutPhase, bootPhase);
  const [fault, setFault] = useState<CheckoutFault>(null);
  const keyRef = useRef<string | null>(null);
  const busy = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (phase.name !== "boot" || !visit.data) return;
    const pending = pendingPayment(visit.data);
    if (!pending) {
      dispatch({ type: "start" });
      return;
    }
    client.setQueryData(["payments", pending.id], pending);
    dispatch({ type: "resume", payment: pending });
  }, [client, phase.name, visit.data]);

  const watched = phase.name === "pending" || phase.name === "manual" || phase.name === "expired" ? phase.payment.id : null;
  const live = usePaymentStatus(watched);
  const paidId = phase.name === "paid" ? phase.payment.id : null;

  useEffect(() => {
    const payment = live.payment;
    if (!payment || (phase.name !== "pending" && phase.name !== "manual" && phase.name !== "expired")) return;
    if (samePayment(phase.payment, payment)) return;
    dispatch({ type: "sync", payment });
  }, [live.payment, phase]);

  useEffect(() => {
    if (!paidId) return;
    void client.invalidateQueries({ queryKey: ["visits", visitId] });
    void client.invalidateQueries({ queryKey: ["tables"] });
  }, [client, paidId, visitId]);

  function refresh() {
    return Promise.all([
      client.invalidateQueries({ queryKey: ["visits", visitId] }),
      client.invalidateQueries({ queryKey: ["tables"] }),
    ]);
  }

  function keyForAttempt(): string {
    keyRef.current ??= crypto.randomUUID();
    return keyRef.current;
  }

  function showConflict(error: unknown): boolean {
    if (!(error instanceof ApiError)) return false;
    if (error.code === "PAYMENT_IN_FLIGHT") {
      const part = readAttempt(error.data)?.parts.find((item) => item.status === "pending");
      if (!part) return false;
      client.setQueryData(["payments", part.id], part);
      setFault(null);
      dispatch({ type: "pending", payment: part });
      return true;
    }
    if (error.code === "NOTHING_TO_PAY") {
      void refresh().then(() => onDoneRef.current());
      return true;
    }
    return false;
  }

  const create = useMutation({
    mutationFn: (input: { method: PaymentMethod; key: string }) => createPayment(visitId, input.method, input.key),
    onSuccess: (attempt: PaymentAttempt) => {
      const part = attempt.parts[0];
      keyRef.current = null;
      if (!part) {
        setFault("failed");
        dispatch({ type: "to-choose" });
        return;
      }
      client.setQueryData(["payments", part.id], part);
      setFault(null);
      if (part.status === "completed") {
        void refresh().then(() => onDoneRef.current());
        return;
      }
      dispatch({ type: "pending", payment: part });
    },
    onError: (error) => {
      if (showConflict(error)) return;
      setFault(faultOf(error));
      dispatch({ type: "to-choose" });
    },
  });

  const cancel = useMutation({
    mutationFn: (paymentId: string) => cancelPayment(paymentId),
    onSuccess: (payment: Payment) => {
      keyRef.current = null;
      void refresh();
      dispatch({ type: "sync", payment });
    },
    onError: (error, paymentId) => {
      if (error instanceof ApiError && error.status === 409) {
        void getPayment(paymentId).then((payment) => dispatch({ type: "sync", payment }));
        return;
      }
      setFault("failed");
    },
  });

  const mark = useMutation({
    mutationFn: (input: { paymentId: string; reason: ManualConfirmReason; note: string }) =>
      markPaymentPaid(input.paymentId, {
        via: "manual",
        reason: input.reason,
        ...(input.note.trim() ? { note: input.note.trim() } : {}),
      }),
    onSuccess: (payment: Payment) => {
      toast.success("ยืนยันด้วยตนเอง · บันทึกให้เจ้าของตรวจสอบแล้ว");
      client.setQueryData(["payments", payment.id], payment);
      dispatch({ type: "paid", payment });
    },
    onError: (error, input) => {
      if (error instanceof ApiError && error.status === 409) {
        void getPayment(input.paymentId).then((payment) => dispatch({ type: "sync", payment }));
        return;
      }
      setFault("failed");
    },
  });

  function runCreate(method: PaymentMethod, key: string) {
    busy.current = true;
    create.mutate({ method, key }, { onSettled: () => { busy.current = false; } });
  }

  function submit() {
    if (phase.name !== "choose" || busy.current) return;
    if (phase.method === "cash" && cashShort(phase.received, visit.data?.bill.remaining ?? "0.00")) return;
    setFault(null);
    runCreate(phase.method, keyForAttempt());
  }

  function newQr() {
    if (busy.current) return;
    const key = crypto.randomUUID();
    keyRef.current = key;
    setFault(null);
    runCreate("promptpay", key);
  }

  function confirmManual() {
    if (phase.name !== "manual" || phase.reason === "" || busy.current) return;
    mark.mutate({ paymentId: phase.payment.id, reason: phase.reason, note: phase.note });
  }

  return {
    visit: visit.data,
    phase,
    fault,
    socketDown: live.socketDown,
    pending: create.isPending || cancel.isPending || mark.isPending,
    setMethod: (method: PaymentMethod) => {
      if (phase.name !== "choose" || phase.method === method) return;
      keyRef.current = null;
      setFault(null);
      dispatch({ type: "method", method });
    },
    setReceived: (value: string) => dispatch({ type: "received", value }),
    submit,
    newQr,
    cancelQr: () => {
      if (phase.name === "pending") cancel.mutate(phase.payment.id);
    },
    openManual: () => dispatch({ type: "manual" }),
    back: () => dispatch({ type: "back" }),
    setReason: (reason: ManualConfirmReason) => dispatch({ type: "reason", reason }),
    setNote: (note: string) => dispatch({ type: "note", note }),
    confirmManual,
  };
}

export type CheckoutController = ReturnType<typeof useCheckout>;
