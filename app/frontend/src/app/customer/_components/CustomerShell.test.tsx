import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { fakeCustomerSocket } from "@/test/fake-customer-socket";
import { CustomerShell } from "./CustomerShell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/customer/menu" }));

function renderShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CustomerShell>
        <p>เมนู</p>
      </CustomerShell>
    </QueryClientProvider>,
  );
}

test("AC-2: an expired guest session shows one expired screen — no refresh, no redirect loop", async () => {
  let sessionCalls = 0;
  let refreshes = 0;
  server.use(
    http.get("*/api/customer/session", () => {
      sessionCalls += 1;
      return HttpResponse.json(apiEnvelope(null, 401, "GUEST_SESSION_INVALID", "เซสชันหมดอายุ"), { status: 401 });
    }),
    http.post("*/api/auth/refresh", () => {
      refreshes += 1;
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );
  renderShell();
  expect(await screen.findByText("เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง")).toBeInTheDocument();
  expect(screen.queryByText("เมนู")).not.toBeInTheDocument();
  expect(sessionCalls).toBe(1);
  expect(refreshes).toBe(0);
});

test("a live session renders the table header and its screen", async () => {
  renderShell();
  expect(await screen.findByRole("heading", { name: "โต๊ะ T3" })).toBeInTheDocument();
  expect(screen.getByText("เมนู")).toBeInTheDocument();
});

test("AC-6: sessionEnded over the socket shows the closed screen and drops the stored cart", async () => {
  window.localStorage.setItem("bar.customer.cart.c0000000-0000-4000-8000-000000000900", "x");
  renderShell();
  await screen.findByRole("heading", { name: "โต๊ะ T3" });
  act(() => fakeCustomerSocket.handlers?.onTabChanged(true));
  expect(await screen.findByText("โต๊ะนี้ปิดแล้ว ขอบคุณที่มาใช้บริการ")).toBeInTheDocument();
  expect(screen.getByText("สแกน QR ที่โต๊ะเพื่อเริ่มใหม่")).toBeInTheDocument();
  expect(screen.queryByText("เมนู")).not.toBeInTheDocument();
});

test("AC-7: a lost socket shows the banner, a reconnect clears it and refetches the tab", async () => {
  let tabCalls = 0;
  server.use(
    http.get("*/api/customer/tab", () => {
      tabCalls += 1;
      return HttpResponse.json(apiEnvelope({ visitId: null, orders: [], total: "0.00", asOf: new Date().toISOString() }));
    }),
  );
  renderShell();
  await screen.findByRole("heading", { name: "โต๊ะ T3" });
  await waitFor(() => expect(tabCalls).toBe(1));
  act(() => fakeCustomerSocket.handlers?.onLost());
  expect(screen.getByText("การเชื่อมต่อขาดหาย · ข้อมูลอาจไม่ล่าสุด")).toBeInTheDocument();
  act(() => fakeCustomerSocket.handlers?.onConnected());
  await waitFor(() => expect(screen.queryByText(/การเชื่อมต่อขาดหาย/)).not.toBeInTheDocument());
  await waitFor(() => expect(tabCalls).toBe(2));
});

test("a refused handshake is the expired screen, not the closed one", async () => {
  renderShell();
  await screen.findByRole("heading", { name: "โต๊ะ T3" });
  act(() => fakeCustomerSocket.handlers?.onRejected());
  expect(await screen.findByText("เซสชันหมดอายุ กรุณาสแกน QR ที่โต๊ะอีกครั้ง")).toBeInTheDocument();
});

test("a tab.changed ping refetches the tab", async () => {
  let tabCalls = 0;
  server.use(
    http.get("*/api/customer/tab", () => {
      tabCalls += 1;
      return HttpResponse.json(apiEnvelope({ visitId: null, orders: [], total: "0.00", asOf: new Date().toISOString() }));
    }),
  );
  renderShell();
  await waitFor(() => expect(tabCalls).toBe(1));
  act(() => fakeCustomerSocket.handlers?.onTabChanged(false));
  await waitFor(() => expect(tabCalls).toBe(2));
});
