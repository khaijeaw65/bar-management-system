"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { notifyGuestExpired } from "@/lib/api/customer";
import { connectCustomerSocket } from "@/lib/socket/customer-socket";
import { sessionKey } from "./useGuestSession";
import { paymentKey } from "./useCustomerPayment";
import { tabKey } from "./useCustomerTab";

/** Keeps the tab live over the guest socket; `lost` drives the "connection lost" banner. */
export function useCustomerLive(onEnded: () => void): { lost: boolean } {
  const client = useQueryClient();
  const [lost, setLost] = useState(false);
  const wasLost = useRef(false);
  const ended = useRef(onEnded);
  useEffect(() => {
    ended.current = onEnded;
  });

  useEffect(() => {
    const refetch = (keys: readonly (readonly string[])[]) => {
      for (const queryKey of keys) void client.invalidateQueries({ queryKey });
    };
    return connectCustomerSocket({
      onTabChanged: (sessionEnded) => (sessionEnded ? ended.current() : refetch([tabKey, paymentKey, sessionKey])),
      onConnected: () => {
        setLost(false);
        if (wasLost.current) refetch([tabKey, paymentKey, sessionKey, ["customer", "menu"]]);
        wasLost.current = false;
      },
      onLost: () => {
        wasLost.current = true;
        setLost(true);
      },
      onRejected: notifyGuestExpired,
    });
  }, [client]);

  return { lost };
}
