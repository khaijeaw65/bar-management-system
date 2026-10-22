"use client";

import { toast } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { ApiError } from "@/lib/api/errors";
import { closeVisit, getVisit } from "@/lib/api/visits";
import { getVenue } from "@/lib/api/venue";
import { hasMoney } from "./session-groups";

function readVisitId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("visitId" in payload)) return null;
  const id = payload.visitId;
  return typeof id === "string" ? id : null;
}

function isClosed(payload: unknown): boolean {
  return Boolean(payload && typeof payload === "object" && "state" in payload && payload.state === "closed");
}

function failureOf(error: unknown): "flight" | "gone" | "retry" {
  if (!(error instanceof ApiError)) return "retry";
  if (error.code === "PAYMENT_IN_FLIGHT") return "flight";
  if (error.code === "INVALID_STATE_TRANSITION") return "gone";
  return "retry";
}

export function useSession(visitId: string, onClose: () => void, holdEscape = false) {
  const client = useQueryClient();
  const visit = useQuery({ queryKey: ["visits", visitId], queryFn: () => getVisit(visitId), retry: false });
  const venue = useQuery({ queryKey: ["venue"], queryFn: getVenue, staleTime: 60_000, retry: false });
  const [confirming, setConfirming] = useState(false);
  const onCloseRef = useRef(onClose);
  const self = useRef(false);
  const reportedMissing = useRef<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function refresh(payload: unknown) {
    if (readVisitId(payload) !== visitId) return;
    void client.invalidateQueries({ queryKey: ["visits", visitId] });
  }

  function onState(payload: unknown) {
    if (readVisitId(payload) !== visitId) return;
    if (!isClosed(payload)) {
      refresh(payload);
      return;
    }
    if (self.current) return;
    toast.danger("โต๊ะนี้ถูกปิดไปแล้ว");
    void client.invalidateQueries({ queryKey: ["tables"] });
    onCloseRef.current();
  }

  useSocketEvent("order.created", refresh);
  useSocketEvent("ticket.status_changed", refresh);
  useSocketEvent("payment.status_changed", refresh);
  useSocketEvent("visit.state_changed", onState);

  useEffect(() => {
    if (!(visit.error instanceof ApiError) || visit.error.status !== 404) return;
    if (reportedMissing.current === visitId) return;
    reportedMissing.current = visitId;
    toast.danger("ไม่พบโต๊ะนี้");
    onCloseRef.current();
  }, [visit.error, visitId]);

  useEffect(() => {
    if (confirming || holdEscape) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirming, holdEscape]);

  const close = useMutation({
    mutationFn: () => closeVisit(visitId),
    onSuccess: (closed) => {
      toast.success(`ปิดโต๊ะ ${closed.seatLabel} แล้ว`);
      void client.invalidateQueries({ queryKey: ["tables"] });
      client.removeQueries({ queryKey: ["visits", visitId] });
      onCloseRef.current();
    },
    onError: (error) => {
      self.current = false;
      const failure = failureOf(error);
      if (failure === "flight") {
        setConfirming(false);
        void visit.refetch();
        return;
      }
      if (failure === "gone") {
        toast.danger("โต๊ะนี้ถูกปิดไปแล้ว");
        void client.invalidateQueries({ queryKey: ["tables"] });
        onCloseRef.current();
      }
    },
  });

  function requestClose() {
    if (visit.data?.bill.locked) return;
    setConfirming(true);
    void visit.refetch();
  }

  function confirmClose() {
    const bill = visit.data?.bill;
    if (!bill || hasMoney(bill.remaining) || close.isPending) return;
    self.current = true;
    close.mutate();
  }

  return {
    visit,
    venue,
    confirming,
    paying: visit.data?.bill.locked === true,
    pending: visit.isPending || (venue.isPending && !venue.isError),
    retryable: close.isError && failureOf(close.error) === "retry",
    close,
    requestClose,
    confirmClose,
    dismissConfirm: () => {
      setConfirming(false);
      close.reset();
    },
  };
}
