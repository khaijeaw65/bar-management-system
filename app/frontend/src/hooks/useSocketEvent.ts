"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStaffSocket, onSocketStatus } from "@/lib/socket/socket";

const LIVE_EVENTS = ["visit.opened", "visit.state_changed", "order.created", "payment.status_changed"] as const;
const DISCONNECT_BANNER_MS = 3_000;

export function useSocketEvent(event: string, handler: (payload: unknown) => void): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getStaffSocket();
    const listener = (payload: unknown) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}

export function useDisconnected(onReconnect: () => void): boolean {
  const [banner, setBanner] = useState(false);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    let down = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    getStaffSocket();
    return onSocketStatus((connected) => {
      clearTimeout(timer);
      if (connected) {
        if (down) onReconnectRef.current();
        down = false;
        setBanner(false);
        return;
      }
      down = true;
      timer = setTimeout(() => setBanner(true), DISCONNECT_BANNER_MS);
    });
  }, []);

  return banner;
}

export function useTableLive(): boolean {
  const client = useQueryClient();
  const invalidate = useCallback(() => {
    void client.invalidateQueries({ queryKey: ["tables"] });
  }, [client]);

  useSocketEvent(LIVE_EVENTS[0], invalidate);
  useSocketEvent(LIVE_EVENTS[1], invalidate);
  useSocketEvent(LIVE_EVENTS[2], invalidate);
  useSocketEvent(LIVE_EVENTS[3], invalidate);
  return useDisconnected(invalidate);
}
