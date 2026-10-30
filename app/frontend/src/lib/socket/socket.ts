import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { apiPost } from "@/lib/api/client";

type StatusListener = (connected: boolean) => void;

const okSchema = z.object({ ok: z.literal(true) });

let socket: Socket | null = null;
let authTried = false;
const statusListeners = new Set<StatusListener>();

function staffSocketUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3011/api";
  return `${new URL(api).origin}/staff`;
}

function emitStatus(connected: boolean): void {
  for (const listener of statusListeners) listener(connected);
}

function isAuthError(error: Error): boolean {
  return error.message === "unauthorized";
}

async function recoverAuth(error: Error): Promise<void> {
  if (!isAuthError(error) || authTried || !socket) return;
  authTried = true;
  try {
    await apiPost("/auth/refresh", undefined, okSchema);
    socket.connect();
  } catch {
    // The next REST 401 is the session gate's job.
  }
}

export function getStaffSocket(): Socket {
  if (socket) return socket;
  socket = io(staffSocketUrl(), { withCredentials: true });
  // ponytail: with MSW there is no server; the e2e fires staff events through this handle.
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
    const live = socket;
    (window as unknown as { __staffSocket?: unknown }).__staffSocket = {
      fire: (event: string, payload: unknown) => {
        for (const listener of live.listeners(event)) listener(payload);
      },
    };
  }
  socket.on("connect", () => {
    authTried = false;
    emitStatus(true);
  });
  socket.on("disconnect", () => emitStatus(false));
  socket.on("connect_error", (error: Error) => {
    emitStatus(false);
    void recoverAuth(error);
  });
  return socket;
}

export function onSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export function resetStaffSocket(): void {
  socket?.disconnect();
  socket?.removeAllListeners();
  socket = null;
  authTried = false;
  statusListeners.clear();
}
