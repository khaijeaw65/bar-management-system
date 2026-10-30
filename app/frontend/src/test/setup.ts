import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { resetApiSession } from "../lib/api/client";
import { resetCustomer } from "../mocks/customer";
import { resetFloor } from "../mocks/handlers";
import { resetMenu } from "../mocks/menu";
import { server } from "../mocks/node";

vi.mock("../lib/socket/customer-socket", async () => {
  const { fakeCustomerSocket } = await import("./fake-customer-socket");
  return { connectCustomerSocket: fakeCustomerSocket.connect };
});

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetApiSession();
  resetFloor();
  resetCustomer();
  resetMenu();
});

afterAll(() => {
  server.close();
});
