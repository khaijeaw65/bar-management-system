import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { Overview } from "./Overview";

// 05:30 Bangkok on 23 Oct is still business day 22 Oct under the 06:00 cut-off.
const NOW = new Date("2026-10-22T22:30:00Z");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  server.events.removeAllListeners();
});

function renderOverview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(<Overview />, { wrapper: Wrap });
}

function summaryRequests(): string[] {
  const seen: string[] = [];
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/reports/summary")) seen.push(url.search);
  });
  return seen;
}

test("30 วัน by default: tiles, delta and payment split from the server; 7 วัน refetches business dates", async () => {
  const requests = summaryRequests();
  const user = userEvent.setup();
  renderOverview();

  expect(await screen.findByText("฿440,660.00")).toBeInTheDocument();
  expect(screen.getByText("600")).toBeInTheDocument();
  expect(screen.getByText("฿734.43")).toBeInTheDocument();
  expect(screen.getAllByText("+12% จากช่วงก่อน")).toHaveLength(2);
  expect(screen.getByRole("img", { name: "PromptPay 72% เงินสด 28%" })).toBeInTheDocument();
  expect(screen.getByText("ยืนยันเอง 3 ครั้ง")).toBeInTheDocument();
  expect(requests).toEqual(["?from=2026-09-23&to=2026-10-22"]);

  await user.click(screen.getByRole("button", { name: /ช่วงเวลา/ }));
  await user.click(await screen.findByRole("option", { name: "7 วัน" }));

  await waitFor(() => expect(requests).toContain("?from=2026-10-16&to=2026-10-22"));
});

test("top and bottom lists show five rows with quantity and revenue; long names stay on one line", async () => {
  renderOverview();

  const top = await screen.findByRole("list", { name: "ขายดี 5 อันดับ" });
  const rows = within(top).getAllByRole("listitem");
  expect(rows).toHaveLength(5);
  expect(rows[0]).toHaveTextContent("โอลด์แฟชั่น");
  expect(rows[0]).toHaveTextContent("ขาย 212");
  expect(rows[0]).toHaveTextContent("฿63,600.00");
  expect(within(top).getByText(/ค็อกเทล 1 แถม 1/)).toHaveClass("truncate");
  expect(within(screen.getByRole("list", { name: "ขายน้อย 5 อันดับ" })).getAllByRole("listitem")).toHaveLength(5);
});

test("shows skeletons while loading and the empty message for a period without sales", async () => {
  server.use(
    http.get("*/api/reports/summary", () =>
      HttpResponse.json(
        apiEnvelope({
          from: "2026-09-23",
          to: "2026-10-22",
          revenue: "0.00",
          bills: 0,
          averageBill: "0.00",
          payments: { promptpay: { amount: "0.00", count: 0 }, cash: { amount: "0.00", count: 0 } },
          manualConfirmations: 0,
          previous: { from: "2026-08-24", to: "2026-09-22", revenue: "0.00", bills: 0, averageBill: "0.00" },
        }),
      ),
    ),
  );
  renderOverview();

  expect(screen.getByLabelText("กำลังโหลดรายงาน")).toBeInTheDocument();
  expect(await screen.findByText("ยังไม่มียอดขายในช่วงนี้")).toBeInTheDocument();
  expect(screen.queryByText("ยอดขายรายวัน")).not.toBeInTheDocument();
});

test("a failed load shows the error with ลองอีกครั้ง, and retry recovers", async () => {
  let fail = true;
  server.use(
    http.get("*/api/reports/summary", () =>
      fail ? HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR", "error"), { status: 500 }) : undefined,
    ),
  );
  const user = userEvent.setup();
  renderOverview();

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("โหลดรายงานไม่สำเร็จ");
  fail = false;
  await user.click(within(alert).getByRole("button", { name: "ลองอีกครั้ง" }));

  expect(await screen.findByText("฿440,660.00")).toBeInTheDocument();
});
