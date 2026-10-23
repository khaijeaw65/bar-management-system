import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { resetStaffSocket } from "@/lib/socket/socket";
import { useMenuLive } from "./useMenuLive";

const created = vi.hoisted(() => {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  const socket = {
    connected: false,
    connect() {},
    disconnect() {},
    removeAllListeners: () => handlers.clear(),
    on(event: string, listener: (...args: unknown[]) => void) {
      handlers.set(event, (handlers.get(event) ?? new Set()).add(listener));
    },
    off(event: string, listener: (...args: unknown[]) => void) {
      handlers.get(event)?.delete(listener);
    },
    emit(event: string, ...args: unknown[]) {
      for (const listener of [...(handlers.get(event) ?? [])]) listener(...args);
    },
  };
  return socket;
});

vi.mock("socket.io-client", () => ({ io: () => created }));

afterEach(() => resetStaffSocket());

test("menu.changed and menu.availability_changed refresh every menu query", () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return createElement(QueryClientProvider, { client }, children);
  }
  renderHook(() => useMenuLive(), { wrapper: Wrap });

  act(() => created.emit("menu.changed", { itemIds: ["x"] }));
  act(() => created.emit("menu.availability_changed", { menuItemId: "x" }));
  act(() => created.emit("visit.opened", {}));

  expect(invalidate).toHaveBeenCalledTimes(2);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["menu"] });
});
