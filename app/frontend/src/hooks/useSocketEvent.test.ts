import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { resetStaffSocket } from "@/lib/socket/socket";
import { useSocketEvent, useTableLive } from "./useSocketEvent";

const created = vi.hoisted(() => {
  const sockets: Array<{
    emit: (event: string, ...args: unknown[]) => void;
    connect: ReturnType<typeof vi.fn>;
  }> = [];

  function make() {
    const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    const socket = {
      connected: false,
      connect: vi.fn(() => {
        socket.connected = true;
        socket.emit("connect");
      }),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(() => handlers.clear()),
      on(event: string, listener: (...args: unknown[]) => void) {
        const set = handlers.get(event) ?? new Set();
        set.add(listener);
        handlers.set(event, set);
      },
      off(event: string, listener: (...args: unknown[]) => void) {
        handlers.get(event)?.delete(listener);
      },
      emit(event: string, ...args: unknown[]) {
        for (const listener of [...(handlers.get(event) ?? [])]) listener(...args);
      },
    };
    sockets.push(socket);
    return socket;
  }

  return { sockets, make };
});

vi.mock("socket.io-client", () => ({
  io: () => created.make(),
}));

afterEach(() => {
  created.sockets.length = 0;
  resetStaffSocket();
  vi.useRealTimers();
});

function latestSocket() {
  const socket = created.sockets.at(-1);
  if (!socket) throw new Error("socket was not created");
  return socket;
}

test("delivers an event and drops the listener on cleanup", () => {
  const handler = vi.fn();
  const view = renderHook(() => useSocketEvent("visit.opened", handler));
  act(() => latestSocket().emit("visit.opened", { id: "1" }));
  expect(handler).toHaveBeenCalledWith({ id: "1" });
  view.unmount();
  act(() => latestSocket().emit("visit.opened", { id: "2" }));
  expect(handler).toHaveBeenCalledTimes(1);
});

test("live events refetch the grid once", () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return createElement(QueryClientProvider, { client }, children);
  }
  renderHook(() => useTableLive(), { wrapper: Wrap });
  const socket = latestSocket();

  act(() => socket.emit("connect"));
  expect(invalidate).not.toHaveBeenCalled();

  for (const event of ["visit.opened", "visit.state_changed", "order.created", "payment.status_changed"]) {
    act(() => socket.emit(event, { visitId: "x" }));
  }
  expect(invalidate).toHaveBeenCalledTimes(4);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["tables"] });
});

test("a socket that stays down shows the banner, then one refetch on reconnect", () => {
  vi.useFakeTimers();
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return createElement(QueryClientProvider, { client }, children);
  }
  const view = renderHook(() => useTableLive(), { wrapper: Wrap });
  const socket = latestSocket();

  act(() => socket.emit("disconnect"));
  expect(view.result.current).toBe(false);
  act(() => vi.advanceTimersByTime(2_999));
  expect(view.result.current).toBe(false);
  act(() => vi.advanceTimersByTime(1));
  expect(view.result.current).toBe(true);

  act(() => socket.emit("connect"));
  expect(view.result.current).toBe(false);
  expect(invalidate).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});

test("an auth error refreshes once and reconnects", async () => {
  const client = new QueryClient();
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return createElement(QueryClientProvider, { client }, children);
  }
  renderHook(() => useSocketEvent("visit.opened", () => undefined), { wrapper: Wrap });
  const socket = latestSocket();
  let refreshes = 0;
  const { server } = await import("@/mocks/node");
  server.events.on("request:start", ({ request }) => {
    if (request.url.includes("/auth/refresh")) refreshes += 1;
  });

  act(() => {
    socket.emit("connect_error", new Error("unauthorized"));
    socket.emit("connect_error", new Error("unauthorized"));
  });
  await vi.waitFor(() => expect(socket.connect).toHaveBeenCalledOnce());
  expect(refreshes).toBe(1);

  refreshes = 0;
  act(() => socket.emit("connect_error", new Error("xhr poll error")));
  await Promise.resolve();
  expect(refreshes).toBe(0);
  expect(socket.connect).toHaveBeenCalledOnce();
});
