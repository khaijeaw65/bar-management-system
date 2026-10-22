import type { Payment } from "@bar/contracts";
import { Toast, toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { drawerVisitId, visitDetail } from "../session.fixture";
import { CheckoutModal } from "./CheckoutModal";

const created = vi.hoisted(() => {
  const sockets: Array<{ emit: (event: string, ...args: unknown[]) => void }> = [];
  const state = { down: false };
  function make() {
    const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    const socket = {
      connected: !state.down,
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
  return { sockets, state, make };
});

vi.mock("socket.io-client", () => ({ io: () => created.make() }));

afterEach(() => {
  created.sockets.length = 0;
  created.state.down = false;
  toast.clear();
  resetStaffSocket();
});

const paymentId = "70000000-0000-4000-8000-0000000000a1";
const attemptId = "71000000-0000-4000-8000-0000000000a1";
const bill = { total: "1240.00", paid: "0.00", remaining: "1240.00", locked: false };

function payment(extra: Partial<Payment> = {}): Payment {
  return {
    id: paymentId,
    attemptId,
    visitId: drawerVisitId,
    partNo: 1,
    partCount: 1,
    amount: "1240.00",
    method: "promptpay",
    status: "pending",
    confirmedVia: null,
    statusReason: null,
    statusNote: null,
    qrPayload: "00020101021229370016A000000677010111",
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    paidAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

function attempt(part: Payment) {
  return { attemptId, visitId: drawerVisitId, mode: "merge" as const, total: part.amount, parts: [part] };
}

function reply(data: unknown, status = 200, code = "") {
  return HttpResponse.json(apiEnvelope(data, status, code), { status });
}

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        {children}
      </QueryClientProvider>
    );
  }
  const onClose = vi.fn();
  render(<CheckoutModal visitId={drawerVisitId} onClose={onClose} />, { wrapper: Wrap });
  return onClose;
}

function showBill(extra: Parameters<typeof visitDetail>[0] = {}) {
  server.use(http.get("*/api/visits/:id", () => reply(visitDetail({ bill, ...extra }))));
}

function pendingVisit(part: Payment) {
  return visitDetail({ bill: { ...bill, locked: true }, payments: [attempt(part)] });
}

test("one create with a key; double tap sends one; QR, amount and countdown show", async () => {
  showBill();
  const keys: string[] = [];
  server.use(
    http.post("*/api/visits/:id/payments", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key") ?? "");
      return reply(attempt(payment()), 201);
    }),
    http.get("*/api/payments/:id", () => reply(payment())),
  );
  const user = userEvent.setup();
  renderModal();
  const create = await screen.findByRole("button", { name: "สร้าง QR" });
  await user.dblClick(create);
  expect(await screen.findByText(/หมดเวลาใน 1[45]:/)).toBeInTheDocument();
  expect(screen.getByText("฿1,240.00")).toBeInTheDocument();
  expect(document.querySelector("svg")).not.toBeNull();
  expect(keys).toHaveLength(1);
  expect(keys[0]).toMatch(/[0-9a-f-]{36}/);
});

test("a network failure then retry reuses the same key", async () => {
  showBill();
  const keys: string[] = [];
  let calls = 0;
  server.use(
    http.post("*/api/visits/:id/payments", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key") ?? "");
      calls += 1;
      if (calls === 1) return HttpResponse.error();
      return reply(attempt(payment()), 201);
    }),
    http.get("*/api/payments/:id", () => reply(payment())),
  );
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "สร้าง QR" }));
  expect(await screen.findByText("สร้าง QR ไม่สำเร็จ ลองอีกครั้ง")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "สร้าง QR" }));
  expect(await screen.findByText(/หมดเวลาใน/)).toBeInTheDocument();
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
});

test("409 PAYMENT_IN_FLIGHT shows the existing pending QR", async () => {
  showBill();
  server.use(
    http.post("*/api/visits/:id/payments", () => reply({ details: attempt(payment()) }, 409, "PAYMENT_IN_FLIGHT")),
    http.get("*/api/payments/:id", () => reply(payment())),
  );
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "สร้าง QR" }));
  expect(await screen.findByText(/หมดเวลาใน/)).toBeInTheDocument();
});

test("409 PROMPTPAY_NOT_SET shows its alert and cash stays selectable", async () => {
  showBill();
  server.use(http.post("*/api/visits/:id/payments", () => reply(null, 409, "PROMPTPAY_NOT_SET")));
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "สร้าง QR" }));
  expect(await screen.findByText("ยังไม่ได้ตั้งพร้อมเพย์ — ใช้เงินสด หรือตั้งค่าก่อน")).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: "เงินสด" }));
  expect(screen.getByRole("button", { name: "รับเงินสด" })).toBeEnabled();
});

test("cash completes in one POST; a short tender blocks, an empty one allows", async () => {
  showBill();
  let posts = 0;
  server.use(
    http.post("*/api/visits/:id/payments", () => {
      posts += 1;
      return reply(attempt(payment({ method: "cash", status: "completed", confirmedVia: "cash", qrPayload: null, expiresAt: null })), 201);
    }),
  );
  const user = userEvent.setup();
  const onClose = renderModal();
  await user.click(await screen.findByRole("radio", { name: "เงินสด" }));
  await user.type(screen.getByRole("textbox", { name: /รับเงินมา/ }), "1000");
  expect(screen.getByRole("button", { name: "รับเงินสด" })).toBeDisabled();
  await user.clear(screen.getByRole("textbox", { name: /รับเงินมา/ }));
  await user.type(screen.getByRole("textbox", { name: /รับเงินมา/ }), "1500");
  expect(screen.getByText(/เงินทอน/)).toHaveTextContent("฿260.00");
  await user.clear(screen.getByRole("textbox", { name: /รับเงินมา/ }));
  await user.click(screen.getByRole("button", { name: "รับเงินสด" }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(posts).toBe(1);
});

test("a completed event shows the paid result", async () => {
  server.use(http.get("*/api/visits/:id", () => reply(pendingVisit(payment()))), http.get("*/api/payments/:id", () => reply(payment())));
  renderModal();
  await screen.findByText(/หมดเวลาใน/);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  act(() => {
    created.sockets.at(-1)?.emit("payment.status_changed", {
      paymentId,
      attemptId,
      visitId: drawerVisitId,
      status: "completed",
      confirmedVia: "manual",
      statusReason: null,
      amount: "1240.00",
      partNo: 1,
      partCount: 1,
    });
  });
  expect(await screen.findByText(/ชำระแล้ว ฿1,240.00/)).toBeInTheDocument();
});

test("expired shows the timeout and a new QR sends a new key", async () => {
  const expired = payment({ status: "cancelled", statusReason: "expired" });
  showBill();
  const keys: string[] = [];
  server.use(
    http.post("*/api/visits/:id/payments", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key") ?? "");
      return reply(attempt(keys.length === 1 ? payment() : payment({ id: "70000000-0000-4000-8000-0000000000a2" })), 201);
    }),
    http.get("*/api/payments/:id", ({ params }) => reply(params.id === paymentId ? expired : payment({ id: String(params.id) }))),
  );
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "สร้าง QR" }));
  await screen.findByText(/หมดเวลาใน/);
  act(() => {
    created.sockets.at(-1)?.emit("payment.status_changed", {
      paymentId,
      attemptId,
      visitId: drawerVisitId,
      status: "cancelled",
      confirmedVia: null,
      statusReason: "expired",
      amount: "1240.00",
      partNo: 1,
      partCount: 1,
    });
  });
  expect(await screen.findByText("QR หมดเวลา")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "สร้าง QR ใหม่" }));
  await screen.findByText(/หมดเวลาใน/);
  expect(keys).toHaveLength(2);
  expect(keys[1]).not.toBe(keys[0]);
});

test("cancel QR returns to checkout; a 409 shows the real completed state", async () => {
  server.use(
    http.get("*/api/visits/:id", () => reply(pendingVisit(payment()))),
    http.get("*/api/payments/:id", () => reply(payment())),
    http.post("*/api/payments/:id/cancel", () => reply(payment({ status: "cancelled", statusReason: "staff_cancel" }))),
  );
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "ยกเลิก QR" }));
  expect(await screen.findByRole("button", { name: "สร้าง QR" })).toBeInTheDocument();
});

test("cancel hitting 409 shows the completed payment", async () => {
  server.use(
    http.get("*/api/visits/:id", () => reply(pendingVisit(payment()))),
    http.get("*/api/payments/:id", () => reply(payment({ status: "completed", confirmedVia: "manual", paidAt: new Date().toISOString() }))),
    http.post("*/api/payments/:id/cancel", () => reply(null, 409, "INVALID_STATE_TRANSITION")),
  );
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "ยกเลิก QR" }));
  expect(await screen.findByText(/ชำระแล้ว ฿1,240.00/)).toBeInTheDocument();
});

test("manual confirm needs a reason, other needs a note, then flags the payment", async () => {
  let body: unknown;
  server.use(
    http.get("*/api/visits/:id", () => reply(pendingVisit(payment()))),
    http.get("*/api/payments/:id", () => reply(payment())),
    http.post("*/api/payments/:id/mark-paid", async ({ request }) => {
      body = await request.json();
      return reply(payment({ status: "completed", confirmedVia: "manual", paidAt: new Date().toISOString() }));
    }),
  );
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "ยืนยันด้วยตนเอง" }));
  const confirm = screen.getByRole("button", { name: "ยืนยันว่าชำระแล้ว" });
  expect(confirm).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /เหตุผล|เลือก/ }));
  await user.click(await screen.findByRole("option", { name: "อื่นๆ" }));
  expect(confirm).toBeDisabled();
  await user.type(screen.getByRole("textbox", { name: "หมายเหตุ" }), "โอนผ่านแอปอื่น");
  expect(confirm).toBeEnabled();
  await user.click(confirm);
  expect(await screen.findByText(/ชำระแล้ว ฿1,240.00/)).toBeInTheDocument();
  expect(within(screen.getByRole("dialog")).getByText("ยืนยันด้วยตนเอง")).toBeInTheDocument();
  expect(await screen.findByText("ยืนยันด้วยตนเอง · บันทึกให้เจ้าของตรวจสอบแล้ว")).toBeInTheDocument();
  expect(body).toEqual({ via: "manual", reason: "other", note: "โอนผ่านแอปอื่น" });
});

test("with the socket down the 5 s poll delivers the result", async () => {
  created.state.down = true;
  let polls = 0;
  server.use(
    http.get("*/api/visits/:id", () => reply(pendingVisit(payment()))),
    http.get("*/api/payments/:id", () => {
      polls += 1;
      return reply(polls < 2 ? payment() : payment({ status: "completed", confirmedVia: "manual", paidAt: new Date().toISOString() }));
    }),
  );
  renderModal();
  expect(await screen.findByText("การเชื่อมต่อขาด กำลังตรวจสอบสถานะ…")).toBeInTheDocument();
  expect(await screen.findByText(/ชำระแล้ว ฿1,240.00/, undefined, { timeout: 8000 })).toBeInTheDocument();
}, 12_000);
