"use client";

import type { CallStaffReason } from "@bar/contracts";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { callStaff } from "@/lib/api/customer";
import { ApiError } from "@/lib/api/errors";
import { useCallLock } from "./useCallLock";

export const CALL_LOCK_SECONDS = 60;

export type CallOutcome = "idle" | "sent" | "limited" | "error";

/** The bell: one call per 60 s. A 429 shows the same locked state with the server's message. */
export function useCallStaff() {
  const { remaining, lock } = useCallLock();
  const [outcome, setOutcome] = useState<CallOutcome>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (input: { reason: CallStaffReason | null; note: string }) =>
      callStaff({ ...(input.reason ? { reason: input.reason } : {}), ...(input.note ? { note: input.note } : {}) }),
    onSuccess: () => {
      lock(CALL_LOCK_SECONDS);
      setOutcome("sent");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 429) {
        lock(CALL_LOCK_SECONDS);
        setMessage(error.message);
        setOutcome("limited");
        return;
      }
      setOutcome("error");
    },
  });
  const locked = remaining > 0;
  return {
    outcome,
    message,
    remaining,
    locked,
    pending: mutation.isPending,
    send: (reason: CallStaffReason | null, note: string) => {
      if (!locked && !mutation.isPending) mutation.mutate({ reason, note });
    },
  };
}
