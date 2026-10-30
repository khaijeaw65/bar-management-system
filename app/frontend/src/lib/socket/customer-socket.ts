import { TAB_CHANGED, TabChangedPayloadSchema } from "@bar/contracts";
import { io } from "socket.io-client";

export interface CustomerSocketHandlers {
  onTabChanged: (sessionEnded: boolean) => void;
  onConnected: () => void;
  onLost: () => void;
  /** The handshake was refused: the cookie is gone — same signal as a 401. */
  onRejected: () => void;
}

function customerSocketUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3011/api";
  return `${new URL(api).origin}/customer`;
}

/** One guest socket for the customer layout (DR-028: own path keeps the `/api/customer` cookie on the handshake). */
export function connectCustomerSocket(handlers: CustomerSocketHandlers): () => void {
  // ponytail: with MSW there is no server; the e2e drives these handlers from `window.__customerSocket`.
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
    (window as unknown as { __customerSocket?: CustomerSocketHandlers }).__customerSocket = handlers;
    handlers.onConnected();
    return () => undefined;
  }
  const socket = io(customerSocketUrl(), { path: "/api/customer/socket.io", withCredentials: true });
  socket.on("connect", handlers.onConnected);
  socket.on("disconnect", handlers.onLost);
  socket.on("connect_error", (error: Error) => {
    if (error.message !== "unauthorized") {
      handlers.onLost();
      return;
    }
    socket.disconnect();
    handlers.onRejected();
  });
  socket.on(TAB_CHANGED, (payload: unknown) => {
    const parsed = TabChangedPayloadSchema.safeParse(payload);
    if (parsed.success) handlers.onTabChanged(parsed.data.sessionEnded === true);
  });
  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
