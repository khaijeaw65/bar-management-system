import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { Toast, toast } from "@heroui/react";
import { usePendingTicketCount } from "@/hooks/useTicketBoard";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { order, orderLine, ticket } from "../../tables/_components/session.fixture";
import { OrdersBoard } from "./OrdersBoard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

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

afterEach(() => {
  created.sockets.length = 0;
  toast.clear();
  resetStaffSocket();
  server.events.removeAllListeners();
});

const kitchenVenue = {
  name: "The Loft",
  slug: "the-loft",
  kitchenDisplayEnabled: true,
  businessDayCutoff: "06:00",
  counterQrEnabled: false,
};

function Count() {
  return <output aria-label="pending">{usePendingTicketCount()}</output>;
}

function renderBoard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        <Count />
        {children}
      </QueryClientProvider>
    );
  }
  return render(<OrdersBoard />, { wrapper: Wrap });
}

function column(name: string) {
  return within(screen.getByRole("region", { name }));
}

function emit(event: string, payload: unknown) {
  const socket = created.sockets.at(-1);
  if (!socket) throw new Error("socket was not created");
  act(() => socket.emit(event, payload));
}

test("kitchen off: three columns, oldest first, no station badge", async () => {
  renderBoard();
  expect(await screen.findByRole("article", { name: "ออเดอร์ #0041 T3" })).toBeInTheDocument();

  for (const name of ["ใหม่", "กำลังเตรียม", "มีปัญหา"]) expect(screen.getByRole("region", { name })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "พร้อมเสิร์ฟ" })).not.toBeInTheDocument();
  expect(column("ใหม่").getByText("2× สิงห์")).toBeInTheDocument();
  expect(column("กำลังเตรียม").getByText("กำลังเตรียม · Beam")).toBeInTheDocument();
  expect(column("มีปัญหา").getByText("ของหมด")).toBeInTheDocument();
  expect(screen.queryByText("บาร์")).not.toBeInTheDocument();
  expect(screen.queryByText("กรองสถานี")).not.toBeInTheDocument();
});

test("accepting moves the card to กำลังเตรียม with the accepter's name", async () => {
  const user = userEvent.setup();
  renderBoard();
  await user.click(await screen.findByRole("button", { name: "รับออเดอร์ #0041 T3" }));

  await waitFor(() => expect(column("กำลังเตรียม").getByRole("article", { name: "ออเดอร์ #0041 T3" })).toBeInTheDocument());
  expect(column("ใหม่").getByText("ไม่มีออเดอร์")).toBeInTheDocument();
  expect(screen.getByLabelText("pending")).toHaveTextContent("0");
});

test("serving removes the card and the pending count stays right", async () => {
  const user = userEvent.setup();
  renderBoard();
  await user.click(await screen.findByRole("button", { name: "เสิร์ฟแล้ว #0042 C4" }));
  await waitFor(() => expect(screen.queryByRole("article", { name: "ออเดอร์ #0042 C4" })).not.toBeInTheDocument());
  expect(screen.getByLabelText("pending")).toHaveTextContent("1");
});

test("kitchen on: four columns, station badges, filter, and counters skip ready", async () => {
  const tickets = [
    ticket("60000000-0000-4000-8000-000000000011", 51, [orderLine("70000000-0000-4000-8000-000000000011", "สิงห์")], {
      status: "accepted",
      station: "bar",
    }),
    ticket("60000000-0000-4000-8000-000000000012", 52, [orderLine("70000000-0000-4000-8000-000000000012", "ปีกไก่")], {
      status: "accepted",
      station: "food",
      seat: { id: "10000000-0000-4000-8000-000000000002", label: "C4", kind: "counter" },
    }),
    ticket("60000000-0000-4000-8000-000000000013", 53, [orderLine("70000000-0000-4000-8000-000000000013", "โมฮิโต้")], {
      status: "ready",
      station: "bar",
    }),
  ];
  server.use(
    http.get("*/api/venue", () => HttpResponse.json(apiEnvelope(kitchenVenue))),
    http.get("*/api/tickets", () => HttpResponse.json(apiEnvelope({ items: tickets }))),
  );
  const user = userEvent.setup();
  renderBoard();
  expect(await screen.findByRole("region", { name: "พร้อมเสิร์ฟ" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "พร้อมแล้ว #0051 T3" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "เสิร์ฟแล้ว #0052 C4" })).toBeInTheDocument();
  expect(column("พร้อมเสิร์ฟ").getByRole("button", { name: "เสิร์ฟแล้ว #0053 T3" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "เฉพาะครัว" }));
  expect(screen.queryByRole("article", { name: "ออเดอร์ #0051 T3" })).not.toBeInTheDocument();
  expect(screen.getByRole("article", { name: "ออเดอร์ #0052 C4" })).toBeInTheDocument();
});

test("a 409 shows the toast, refetches and leaves the button usable", async () => {
  server.use(
    http.post("*/api/tickets/:id/accept", () =>
      HttpResponse.json(apiEnvelope(null, 409, "INVALID_STATE_TRANSITION", "สถานะออเดอร์ไม่ถูกต้อง"), { status: 409 }),
    ),
  );
  const user = userEvent.setup();
  renderBoard();
  const button = await screen.findByRole("button", { name: "รับออเดอร์ #0041 T3" });
  await user.click(button);
  expect(await screen.findByText("ออเดอร์ #0041 เปลี่ยนสถานะแล้ว")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: "รับออเดอร์ #0041 T3" })).not.toHaveAttribute("data-pending"));
  expect(screen.getByRole("button", { name: "รับออเดอร์ #0041 T3" })).toBeEnabled();
});

test("order.created adds a highlighted card, toasts and raises the count", async () => {
  const fresh = ticket("60000000-0000-4000-8000-000000000021", 60, [orderLine("70000000-0000-4000-8000-000000000021", "เหล้า")]);
  const placed = order("30000000-0000-4000-8000-000000000021", 60, fresh.createdAt, [fresh], "120.00");
  renderBoard();
  await screen.findByRole("article", { name: "ออเดอร์ #0041 T3" });

  server.use(
    http.get("*/api/tickets", () => HttpResponse.json(apiEnvelope({ items: [fresh] }))),
  );
  emit("order.created", placed);

  expect(await screen.findByText("ออเดอร์ใหม่ T3")).toBeInTheDocument();
  const card = await screen.findByRole("article", { name: "ออเดอร์ #0060 T3" });
  expect(card.className).toContain("ring-2");
  expect(screen.getByLabelText("pending")).toHaveTextContent("1");
});

test("menu.availability_changed toasts the tables and the voided card leaves", async () => {
  renderBoard();
  await screen.findByRole("article", { name: "ออเดอร์ #0041 T3" });
  server.use(
    http.get("*/api/tickets", () => HttpResponse.json(apiEnvelope({ items: [] }))),
  );
  emit("menu.availability_changed", {
    menuItemId: "44444444-4444-4444-8444-444444444444",
    name: "วิสกี้ซาวร์",
    isAvailable: false,
    autoVoided: [
      { ticketId: "60000000-0000-4000-8000-000000000001", orderNumber: 41, seatLabel: "T2", itemCount: 1, ticketStatus: "pending" },
      { ticketId: "60000000-0000-4000-8000-000000000031", orderNumber: 44, seatLabel: "T5", itemCount: 2, ticketStatus: "pending" },
    ],
    notVoided: [
      { ticketId: "60000000-0000-4000-8000-000000000032", orderNumber: 45, seatLabel: "T6", itemCount: 1, reason: "in_progress" },
    ],
  });
  expect(await screen.findByText("วิสกี้ซาวร์ หมด — ยกเลิกอัตโนมัติ 3 รายการ · แจ้งลูกค้าโต๊ะ T2, T5")).toBeInTheDocument();
  expect(screen.getByText("กำลังทำอยู่ / รอชำระ — ตรวจกับลูกค้า: T6")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("article", { name: "ออเดอร์ #0041 T3" })).not.toBeInTheDocument());
});

test("skips a status payload older than the shown ticket", async () => {
  let calls = 0;
  server.use(
    http.get("*/api/tickets", () => {
      calls += 1;
      return HttpResponse.json(apiEnvelope({ items: [] }));
    }),
  );
  renderBoard();
  await waitFor(() => expect(calls).toBe(1));
  emit("ticket.status_changed", { ticketId: "x", updatedAt: "2000-01-01T00:00:00.000Z" });
  expect(calls).toBe(1);
});

test("shows an error with retry", async () => {
  let failing = true;
  server.use(
    http.get("*/api/tickets", () =>
      failing
        ? HttpResponse.json(apiEnvelope(null, 500, "INTERNAL", "พัง"), { status: 500 })
        : HttpResponse.json(apiEnvelope({ items: [] })),
    ),
  );
  const user = userEvent.setup();
  renderBoard();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  failing = false;
  await user.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(await screen.findByRole("region", { name: "ใหม่" })).toBeInTheDocument();
  expect(column("ใหม่").getByText("ไม่มีออเดอร์")).toBeInTheDocument();
});

test("shows busy columns while loading", async () => {
  renderBoard();
  const regions = ["ใหม่", "กำลังเตรียม", "มีปัญหา"].map((name) => screen.getByRole("region", { name }));
  for (const region of regions) expect(region).toHaveAttribute("aria-busy", "true");
  await screen.findByRole("article", { name: "ออเดอร์ #0041 T3" });
});
