import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { resetStaffSocket } from "@/lib/socket/socket";
import { server } from "@/mocks/node";
import { renderScreen } from "./testing";

const socket = vi.hoisted(() => {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
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
    emit(event: string) {
      for (const listener of [...(handlers.get(event) ?? [])]) listener();
    },
  };
});

vi.mock("socket.io-client", () => ({ io: () => socket }));

afterEach(() => {
  resetStaffSocket();
  server.events.removeAllListeners();
});

test("refetches the groups when menu.changed arrives", async () => {
  let reads = 0;
  server.events.on("request:start", ({ request }) => {
    if (request.method === "GET" && new URL(request.url).pathname.endsWith("/menu/modifier-groups")) reads += 1;
  });
  renderScreen();
  await screen.findByText("ระดับน้ำแข็ง");
  expect(reads).toBe(1);

  act(() => socket.emit("menu.changed"));
  await waitFor(() => expect(reads).toBe(2));
});
