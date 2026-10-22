"use client";

import { PaymentStatusChangedPayloadSchema, type Payment } from "@bar/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { getPayment } from "@/lib/api/payments";
import { getStaffSocket, onSocketStatus } from "@/lib/socket/socket";

export function usePaymentStatus(paymentId: string | null): { payment: Payment | undefined; socketDown: boolean } {
  const client = useQueryClient();
  const [socketDown, setSocketDown] = useState(() => getStaffSocket().connected === false);
  const query = useQuery({
    queryKey: ["payments", paymentId],
    queryFn: () => getPayment(paymentId ?? ""),
    enabled: paymentId !== null,
    refetchInterval: socketDown ? 5_000 : false,
    retry: false,
  });

  useEffect(() => {
    return onSocketStatus((connected) => setSocketDown(!connected));
  }, []);

  useSocketEvent("payment.status_changed", (payload) => {
    const parsed = PaymentStatusChangedPayloadSchema.safeParse(payload);
    if (!parsed.success || !paymentId || parsed.data.paymentId !== paymentId) return;
    const next = parsed.data;
    client.setQueryData<Payment>(["payments", paymentId], (current) =>
      current
        ? { ...current, status: next.status, confirmedVia: next.confirmedVia, statusReason: next.statusReason, amount: next.amount }
        : current,
    );
  });

  return { payment: query.data, socketDown };
}
