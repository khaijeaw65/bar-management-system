import { EventEmitter } from "node:events";
import { expect, test, vi } from "vitest";

const sockets: Array<EventEmitter & { disconnect: ReturnType<typeof vi.fn>; removeAllListeners: () => unknown }> = [];
const ioMock = vi.fn((url: string, options: unknown) => {
  void url;
  void options;
  const socket = Object.assign(new EventEmitter(), { disconnect: vi.fn() });
  sockets.push(socket);
  return socket;
});
vi.mock("socket.io-client", () => ({ io: ioMock }));

async function setup() {
  const { connectCustomerSocket } = await vi.importActual<typeof import("./customer-socket")>("./customer-socket");
  const handlers = { onTabChanged: vi.fn(), onConnected: vi.fn(), onLost: vi.fn(), onRejected: vi.fn() };
  const stop = connectCustomerSocket(handlers);
  return { handlers, stop, socket: sockets[sockets.length - 1] as EventEmitter & { disconnect: ReturnType<typeof vi.fn> } };
}

test("connects to /customer on its own path with credentials", async () => {
  await setup();
  expect(ioMock).toHaveBeenCalledWith(expect.stringMatching(/\/customer$/), { path: "/api/customer/socket.io", withCredentials: true });
});

test("maps tab.changed and ignores malformed payloads", async () => {
  const { handlers, socket } = await setup();
  const visitId = "c0000000-0000-4000-8000-000000000800";
  socket.emit("tab.changed", { visitId });
  socket.emit("tab.changed", { visitId, sessionEnded: true });
  socket.emit("tab.changed", { nope: 1 });
  expect(handlers.onTabChanged.mock.calls).toEqual([[false], [true]]);
});

test("an unauthorized handshake is a rejection and stops reconnecting; other errors are a lost link", async () => {
  const { handlers, socket } = await setup();
  socket.emit("connect_error", new Error("xhr poll error"));
  expect(handlers.onLost).toHaveBeenCalledTimes(1);
  socket.emit("connect_error", new Error("unauthorized"));
  expect(handlers.onRejected).toHaveBeenCalledTimes(1);
  expect(socket.disconnect).toHaveBeenCalled();
});
