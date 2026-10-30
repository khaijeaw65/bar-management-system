import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { CustomerShell } from "./CustomerShell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

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
