"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cancelPayment, createPayment, notifyTransfer } from "@/lib/api/customer";
import { ApiError } from "@/lib/api/errors";
import { paymentKey } from "./useCustomerPayment";

export type NotifyOutcome = { paymentId: string; at: string } | null;

/** The three things a phone does with the table bill. Every outcome ends in a refetch: the server is the truth. */
export function usePayActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: paymentKey });
  const [notified, setNotified] = useState<NotifyOutcome>(null);
  const [failed, setFailed] = useState(false);

  const create = useMutation({
    // A fresh key per press: a retry after a lost response is a new tap, and the server refuses a second attempt anyway.
    mutationFn: () => createPayment(crypto.randomUUID()),
    onMutate: () => setFailed(false),
    onSettled: refresh,
    onError: (error) => setFailed(!(error instanceof ApiError && error.code === "PAYMENT_IN_FLIGHT")),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelPayment(id),
    onSuccess: (view) => client.setQueryData(paymentKey, view),
    onSettled: refresh,
  });
  const notify = useMutation({
    mutationFn: (id: string) => notifyTransfer(id).then((result) => ({ paymentId: id, at: result.notifiedAt })),
    onSuccess: setNotified,
    onError: (error, id) => {
      // Already told within the minute: the bell is up, so show it as sent.
      if (error instanceof ApiError && error.status === 429) setNotified({ paymentId: id, at: new Date().toISOString() });
    },
  });

  return { create, cancel, notify, notified, failed };
}
