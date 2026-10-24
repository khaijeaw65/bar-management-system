import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
import { Toast, toast } from "@heroui/react";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { formatTHB } from "@/lib/utils/format";
import { formatThaiTime } from "./table-time";
import { SessionDrawer } from "./SessionDrawer";
import { drawerVisitId, order, orderLine, ticket, venueOn, visitDetail } from "./session.fixture";

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

vi.mock("socket.io-client", () => ({
  io: () => created.make(),
}));

afterEach(() => {
  created.sockets.length = 0;
  toast.clear();
  resetStaffSocket();
  server.events.removeAllListeners();
});

function latestSocket() {
  const socket = created.sockets.at(-1);
  if (!socket) throw new Error("socket was not created");
  return socket;
}

function renderDrawer(visitId: string, onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        {children}
      </QueryClientProvider>
    );
  }
  render(<SessionDrawer visitId={visitId} onClose={onClose} />, { wrapper: Wrap });
  return onClose;
}

function show(detail: ReturnType<typeof visitDetail>) {
  server.use(http.get("*/api/visits/:id", () => HttpResponse.json(apiEnvelope(detail))));
}

const staffRef = { staffId: "11111111-1111-4111-8111-111111111111", displayName: "บีม" };

test("shows two order groups newest first with lines and the server bill", async () => {
  const mojitoLarge = orderLine("40000000-0000-4000-8000-000000000001", "โมฮิโต้", {
    variantName: "ใหญ่",
    quantity: 2,
    unitPrice: "240.00",
    lineTotal: "480.00",
    modifiers: [{ optionId: "50000000-0000-4000-8000-000000000001", name: "น้ำแข็งก้อนใหญ่", priceDelta: "0.00" }],
    orderedByName: "บีม",
  });
  const mojito = orderLine("40000000-0000-4000-8000-000000000002", "โมฮิโต้", {
    variantName: "ปกติ",
    unitPrice: "180.00",
    lineTotal: "180.00",
  });
  const beer = orderLine("40000000-0000-4000-8000-000000000003", "สิงห์");
  const detail = visitDetail({
    orders: [
      order("30000000-0000-4000-8000-000000000002", 7, "2026-10-21T11:40:00.000Z", [
        ticket("60000000-0000-4000-8000-000000000002", 7, [beer], {
          status: "accepted",
          acceptedBy: staffRef,
          createdAt: "2026-10-21T11:40:00.000Z",
        }),
      ], "120.00"),
      order("30000000-0000-4000-8000-000000000001", 8, "2026-10-21T12:02:00.000Z", [
        ticket("60000000-0000-4000-8000-000000000001", 8, [mojitoLarge, mojito]),
      ], "660.00"),
    ],
    bill: { total: "780.00", paid: "100.00", remaining: "680.00", locked: false },
  });
  show(detail);
  renderDrawer(drawerVisitId);

  const drawer = await screen.findByRole("complementary", { name: "โต๊ะ T3" });
  expect(within(drawer).getByText("มีแขก")).toBeInTheDocument();
  expect(within(drawer).getByText(/เปิด (?:--:--|\d+:\d{2}) · ต้น/)).toBeInTheDocument();
  expect(within(drawer).getAllByText(/#\d+/).map((item) => item.textContent)).toEqual(["#8", "#7"]);
  expect(within(drawer).getByText(formatThaiTime("2026-10-21T12:02:00.000Z"))).toBeInTheDocument();
  expect(within(drawer).getByText("ใหม่")).toBeInTheDocument();
  expect(within(drawer).getByText("กำลังเตรียม · บีม")).toBeInTheDocument();
  expect(within(drawer).getByText("2× โมฮิโต้ (ใหญ่)")).toBeInTheDocument();
  expect(within(drawer).getByText("1× โมฮิโต้ (ปกติ)")).toBeInTheDocument();
  expect(within(drawer).getByText("1× สิงห์")).toBeInTheDocument();
  expect(within(drawer).queryByText("1× สิงห์ (ปกติ)")).not.toBeInTheDocument();
  expect(within(drawer).getByText("น้ำแข็งก้อนใหญ่ · สั่งโดย บีม")).toBeInTheDocument();
  expect(within(drawer).getByText(formatTHB("480.00"))).toBeInTheDocument();
  expect(within(drawer).queryByText("บาร์")).not.toBeInTheDocument();
  expect(within(drawer).getByText("ยอดรวม").parentElement).toHaveTextContent(formatTHB(detail.bill.total));
  expect(within(drawer).getByText("ชำระแล้ว").parentElement).toHaveTextContent(formatTHB(detail.bill.paid));
  expect(within(drawer).getByText("คงเหลือ").parentElement).toHaveTextContent(formatTHB(detail.bill.remaining));
});

test("splits one order into bar and kitchen groups when the kitchen screen is on", async () => {
  server.use(http.get("*/api/venue", () => HttpResponse.json(apiEnvelope(venueOn))));
  const detail = visitDetail({
    orders: [
      order("30000000-0000-4000-8000-000000000003", 4, "2026-10-21T12:02:00.000Z", [
        ticket("60000000-0000-4000-8000-000000000011", 4, [orderLine("40000000-0000-4000-8000-000000000011", "สิงห์")], {
          station: "bar",
        }),
        ticket("60000000-0000-4000-8000-000000000012", 4, [orderLine("40000000-0000-4000-8000-000000000012", "เฟรนช์ฟรายส์")], {
          station: "food",
        }),
      ], "270.00"),
    ],
  });
  show(detail);
  renderDrawer(drawerVisitId);

  const drawer = await screen.findByRole("complementary", { name: "โต๊ะ T3" });
  expect(within(drawer).getAllByText("#4")).toHaveLength(2);
  expect(within(drawer).getByText("บาร์")).toBeInTheDocument();
  expect(within(drawer).getByText("ครัว")).toBeInTheDocument();
  expect(within(drawer).getByText("1× สิงห์")).toBeInTheDocument();
  expect(within(drawer).getByText("1× เฟรนช์ฟรายส์")).toBeInTheDocument();
});

test("strikes a cancelled line and marks a fully cancelled ticket", async () => {
  const detail = visitDetail({
    orders: [
      order("30000000-0000-4000-8000-000000000004", 5, "2026-10-21T12:02:00.000Z", [
        ticket("60000000-0000-4000-8000-000000000021", 5, [
          orderLine("40000000-0000-4000-8000-000000000021", "สิงห์", { lineTotal: "80.00" }),
          orderLine("40000000-0000-4000-8000-000000000022", "ปีกไก่ทอด", {
            lineTotal: "50.00",
            orderedByName: "บีม",
            cancelledAt: "2026-10-21T12:10:00.000Z",
            cancellation: {
              at: "2026-10-21T12:10:00.000Z",
              reason: "สั่งผิด",
              by: staffRef,
              system: false,
            },
          }),
        ], { status: "sent" }),
      ], "80.00"),
      order("30000000-0000-4000-8000-000000000005", 3, "2026-10-21T11:00:00.000Z", [
        ticket("60000000-0000-4000-8000-000000000022", 3, [
          orderLine("40000000-0000-4000-8000-000000000023", "วิสกี้", {
            lineTotal: "220.00",
            cancelledAt: "2026-10-21T11:20:00.000Z",
            cancellation: { at: "2026-10-21T11:20:00.000Z", reason: null, by: null, system: true },
          }),
        ]),
      ], "0.00"),
    ],
    bill: { total: "80.00", paid: "80.00", remaining: "0.00", locked: false },
  });
  show(detail);
  renderDrawer(drawerVisitId);

  const drawer = await screen.findByRole("complementary", { name: "โต๊ะ T3" });
  expect(within(drawer).getByText("1× ปีกไก่ทอด")).toHaveClass("line-through");
  expect(within(drawer).getAllByText("ยกเลิก").length).toBeGreaterThan(0);
  expect(within(drawer).getByText("สั่งผิด · สั่งโดย บีม")).toBeInTheDocument();
  expect(within(drawer).getByText("ยกเลิกทั้งใบ")).toBeInTheDocument();
  expect(within(drawer).getByText("1× วิสกี้")).toHaveClass("line-through");
  expect(within(drawer).getByText("ยอดรวม").parentElement).toHaveTextContent(formatTHB("80.00"));
  expect(within(drawer).getByText("คงเหลือ").parentElement).toHaveTextContent(formatTHB("0.00"));
  expect(within(drawer).queryByText(formatTHB("350.00"))).not.toBeInTheDocument();
});

test("refetches this visit when an order is created and ignores another visit", async () => {
  const first = orderLine("40000000-0000-4000-8000-000000000031", "สิงห์");
  const added = orderLine("40000000-0000-4000-8000-000000000032", "โมฮิโต้");
  const initial = visitDetail({
    orders: [order("30000000-0000-4000-8000-000000000006", 7, "2026-10-21T11:40:00.000Z", [
      ticket("60000000-0000-4000-8000-000000000031", 7, [first], { createdAt: "2026-10-21T11:40:00.000Z" }),
    ], "120.00")],
  });
  const next = visitDetail({
    orders: [
      order("30000000-0000-4000-8000-000000000007", 9, "2026-10-21T12:20:00.000Z", [
        ticket("60000000-0000-4000-8000-000000000032", 9, [added]),
      ], "180.00"),
      ...initial.orders,
    ],
  });
  let live = initial;
  server.use(http.get("*/api/visits/:id", () => HttpResponse.json(apiEnvelope(live))));
  const onClose = renderDrawer(drawerVisitId);
  expect(await screen.findByText("#7")).toBeInTheDocument();

  live = next;
  latestSocket().emit("order.created", { visitId: "20000000-0000-4000-8000-000000000001" });
  expect(screen.queryByText("#9")).not.toBeInTheDocument();

  latestSocket().emit("order.created", { visitId: drawerVisitId });
  expect(await screen.findByText("#9")).toBeInTheDocument();
  const drawer = screen.getByRole("complementary", { name: "โต๊ะ T3" });
  expect(within(drawer).getAllByText(/#\d+/).map((item) => item.textContent)[0]).toBe("#9");
  expect(onClose).not.toHaveBeenCalled();
});

test("a visit closed elsewhere closes the drawer", async () => {
  show(visitDetail());
  const onClose = renderDrawer(drawerVisitId);
  expect(await screen.findByText("ยังไม่มีออเดอร์")).toBeInTheDocument();
  latestSocket().emit("visit.state_changed", {
    visitId: drawerVisitId,
    tableSeatId: "10000000-0000-4000-8000-000000000003",
    state: "closed",
  });
  expect(await screen.findByText("โต๊ะนี้ถูกปิดไปแล้ว")).toBeInTheDocument();
  expect(onClose).toHaveBeenCalledOnce();
});

test("loading, error with retry, a missing visit, and escape", async () => {
  let fail = true;
  server.use(
    http.get("*/api/visits/:id", async () => {
      await delay(200);
      if (fail) return HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR", "เกิดข้อผิดพลาด"), { status: 500 });
      return HttpResponse.json(apiEnvelope(visitDetail()));
    }),
  );
  const onClose = renderDrawer(drawerVisitId);
  expect(screen.getByRole("complementary", { name: "กำลังโหลดโต๊ะ" })).toHaveAttribute("aria-busy", "true");
  expect(await screen.findByRole("alert")).toHaveTextContent("โหลดข้อมูลโต๊ะไม่สำเร็จ");
  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(await screen.findByText("ยังไม่มีออเดอร์")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "ปิด" }));
  expect(onClose).toHaveBeenCalledOnce();
});

test("a missing visit toasts and clears the selection", async () => {
  const onClose = renderDrawer("99999999-9999-4999-8999-999999999999");
  expect(await screen.findByText("ไม่พบโต๊ะนี้")).toBeInTheDocument();
  expect(onClose).toHaveBeenCalledOnce();
});

test("a locked bill blocks close", async () => {
  show(visitDetail({ bill: { total: "480.00", paid: "0.00", remaining: "480.00", locked: true } }));
  renderDrawer(drawerVisitId);
  const drawer = await screen.findByRole("complementary", { name: "โต๊ะ T3" });
  expect(within(drawer).getByRole("alert")).toHaveTextContent("มีการชำระเงินค้างอยู่");
  expect(within(drawer).getByRole("button", { name: "ดู QR" })).toBeEnabled();
  expect(within(drawer).getByRole("button", { name: "ปิดโต๊ะ" })).toBeDisabled();
  expect(screen.queryByRole("dialog", { name: "ปิดโต๊ะ T3?" })).not.toBeInTheDocument();
});

test("an order placed after the QR sits under the divider", async () => {
  const early = order("30000000-0000-4000-8000-000000000041", 7, "2026-10-21T11:00:00.000Z", [
    ticket("60000000-0000-4000-8000-000000000041", 7, [orderLine("40000000-0000-4000-8000-000000000041", "สิงห์")], {
      createdAt: "2026-10-21T11:00:00.000Z",
    }),
  ], "120.00");
  const late = order("30000000-0000-4000-8000-000000000042", 9, "2026-10-21T12:30:00.000Z", [
    ticket("60000000-0000-4000-8000-000000000042", 9, [orderLine("40000000-0000-4000-8000-000000000042", "โมฮิโต้")], {
      createdAt: "2026-10-21T12:30:00.000Z",
    }),
  ], "180.00");
  show(visitDetail({
    orders: [early, late],
    bill: { total: "120.00", paid: "0.00", remaining: "120.00", locked: true },
    payments: [{
      attemptId: "71000000-0000-4000-8000-000000000041",
      visitId: drawerVisitId,
      mode: "merge",
      total: "120.00",
      parts: [{
        id: "70000000-0000-4000-8000-000000000041",
        attemptId: "71000000-0000-4000-8000-000000000041",
        visitId: drawerVisitId,
        partNo: 1,
        partCount: 1,
        amount: "120.00",
        method: "promptpay",
        status: "pending",
        confirmedVia: null,
        slipTransRef: null,
        slipAmount: null,
        statusReason: null,
        statusNote: null,
        qrPayload: "payload",
        expiresAt: "2026-10-21T12:15:00.000Z",
        paidAt: null,
        createdBy: null,
        updatedBy: null,
        createdAt: "2026-10-21T12:00:00.000Z",
      }],
    }],
  }));
  renderDrawer(drawerVisitId);
  const drawer = await screen.findByRole("complementary", { name: "โต๊ะ T3" });
  const text = drawer.textContent ?? "";
  const divider = text.indexOf("ออเดอร์ใหม่หลังสร้าง QR — ไม่รวมในยอดนี้");
  expect(text.indexOf("#7")).toBeLessThan(divider);
  expect(divider).toBeLessThan(text.indexOf("#9"));
  expect(within(drawer).getByRole("button", { name: "ปิดโต๊ะ" })).toBeDisabled();
});
