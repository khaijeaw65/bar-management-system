import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { todaySample } from "@/mocks/reports";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { Today } from "./Today";

const created = vi.hoisted(() => {
  const sockets: Array<{ emit: (event: string, ...args: unknown[]) => void }> = [];
  function make() {
    const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    const socket = {
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
      connect() {},
      disconnect() {},
      removeAllListeners() {
        handlers.clear();
      },
    };
    sockets.push(socket);
    return socket;
  }
  return { sockets, make };
});

vi.mock("socket.io-client", () => ({ io: () => created.make() }));

const payment = (status: string) => ({
  paymentId: "30000000-0000-4000-8000-000000000001",
  attemptId: "30000000-0000-4000-8000-000000000002",
  visitId: "20000000-0000-4000-8000-000000000001",
  status,
  confirmedVia: status === "completed" ? "cash" : null,
  statusReason: null,
  amount: "240.00",
  partNo: 1,
  partCount: 1,
});

let calls = 0;

beforeEach(() => {
  calls = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true });
  server.events.on("request:start", ({ request }) => {
    if (new URL(request.url).pathname.endsWith("/reports/today")) calls += 1;
  });
});

afterEach(() => {
  vi.useRealTimers();
  created.sockets.length = 0;
  resetStaffSocket();
  server.events.removeAllListeners();
});

function renderToday() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  render(<Today />, { wrapper: Wrap });
}

function emit(event: string, payload?: unknown) {
  act(() => created.sockets[0]?.emit(event, payload));
}

function later(minutes: number, revenue: string) {
  const sample = todaySample();
  const generatedAt = new Date(Date.parse(sample.generatedAt) + minutes * 60_000).toISOString();
  return HttpResponse.json(apiEnvelope({ ...sample, revenue, generatedAt }));
}

test("tiles, hourly bars and open seats oldest first, live", async () => {
  renderToday();

  expect(await screen.findByText("฿18,420.00")).toBeInTheDocument();
  expect(screen.getByText("25")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ออเดอร์ค้าง\s*3/ })).toHaveAttribute("href", "/pos/orders");
  expect(screen.getByRole("link", { name: /มีปัญหา\s*1/ })).toHaveAttribute("href", "/pos/orders");
  expect(screen.getByRole("img", { name: /ยอดขายรายชั่วโมง รวม ฿18,420.00: 18:00 ฿1,240.00.*21:00 ฿8,540.00/ })).toBeInTheDocument();

  const seats = within(screen.getByRole("list", { name: "ที่นั่งที่เปิดอยู่" })).getAllByRole("listitem");
  expect(seats.map((row) => row.textContent?.slice(0, 2))).toEqual(["T4", "C5", "T1", "C1", "T2", "C2", "T6", "C3"]);
  expect(seats[0]).toHaveTextContent("เปิดนาน");
  expect(seats[2]).not.toHaveTextContent("เปิดนาน");
  expect(screen.getByRole("status")).toHaveTextContent("อัปเดต 21:14 น. · สด");
});

test("a completed payment refetches and moves the update time; other statuses do not", async () => {
  renderToday();
  await screen.findByText("฿18,420.00");
  expect(calls).toBe(1);

  emit("payment.status_changed", payment("pending"));
  server.use(http.get("*/api/reports/today", () => later(6, "18660.00")));
  emit("payment.status_changed", payment("completed"));

  expect(await screen.findByText("฿18,660.00")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("อัปเดต 21:20 น. · สด");
  expect(calls).toBe(2);
});

test("refetches every 60 s; socket down greys the dot and keeps the last data", async () => {
  renderToday();
  await screen.findByText("฿18,420.00");

  server.use(http.get("*/api/reports/today", () => later(1, "18500.00")));
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(await screen.findByText("฿18,500.00")).toBeInTheDocument();

  emit("disconnect");
  await act(() => vi.advanceTimersByTimeAsync(3_000));

  expect(screen.getByRole("status")).toHaveTextContent("ไม่ได้อัปเดต");
  expect(screen.getByText("฿18,500.00")).toBeInTheDocument();
});

test("loading skeleton, then error with retry", async () => {
  let fail = true;
  server.use(
    http.get("*/api/reports/today", () =>
      fail ? HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR", "error"), { status: 500 }) : undefined,
    ),
  );
  renderToday();

  expect(screen.getByLabelText("กำลังโหลดรายงาน")).toBeInTheDocument();
  const alert = await screen.findByRole("alert");
  fail = false;
  act(() => within(alert).getByRole("button", { name: "ลองอีกครั้ง" }).click());

  expect(await screen.findByText("฿18,420.00")).toBeInTheDocument();
});
