import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toast, toast } from "@heroui/react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { Order } from "@bar/contracts";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { OrderScreen } from "./OrderScreen";

const push = vi.hoisted(() => vi.fn());
const visitId = "20000000-0000-4000-8000-000000000003";
const mojito = "22222222-2222-4222-8222-222222222222";
const large = "55555555-5555-4555-8555-555555555555";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("socket.io-client", () => ({
  io: () => ({
    on() {},
    off() {},
    connect() {},
    disconnect() {},
    removeAllListeners() {},
  }),
}));

afterEach(() => {
  push.mockReset();
  toast.clear();
  resetStaffSocket();
});

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        {children}
      </QueryClientProvider>
    );
  }
  render(<OrderScreen visitId={visitId} />, { wrapper: Wrap });
}

function placedOrder(): Order {
  const now = "2026-10-22T12:00:00.000Z";
  return {
    id: "30000000-0000-4000-8000-000000000099",
    visitId,
    orderNumber: 1,
    businessDate: "2026-10-22",
    createdAt: now,
    createdBy: null,
    total: "120.00",
    tickets: [
      {
        id: "60000000-0000-4000-8000-000000000099",
        orderId: "30000000-0000-4000-8000-000000000099",
        orderNumber: 1,
        station: "bar",
        status: "pending",
        seat: { id: "10000000-0000-4000-8000-000000000003", label: "T3", kind: "table" },
        items: [],
        issue: null,
        acceptedBy: null,
        sentAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

test("quick add merges a line and undo removes the last tap", async () => {
  const user = userEvent.setup();
  renderScreen();
  const tile = await screen.findByRole("button", { name: /สิงห์/ });
  await user.click(tile);
  await user.click(tile);
  expect(screen.getAllByText("เพิ่ม สิงห์ แล้ว").length).toBeGreaterThan(0);
  const cart = screen.getByRole("complementary", { name: "ตะกร้า" });
  expect(within(cart).getByText("2")).toBeInTheDocument();
  await user.click(screen.getAllByRole("button", { name: "เลิกทำ" }).at(-1)!);
  expect(within(cart).getByText("1")).toBeInTheDocument();
});

test("retries a failed send with the same key and body, and discard leaves the table", async () => {
  const user = userEvent.setup();
  const keys: string[] = [];
  const bodies: string[] = [];
  let calls = 0;
  server.use(
    http.post("*/api/visits/:id/orders", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key") ?? "");
      bodies.push(await request.text());
      calls += 1;
      if (calls === 1) return HttpResponse.error();
      return HttpResponse.json(apiEnvelope(placedOrder()), { status: 201 });
    }),
  );
  renderScreen();
  await user.click(await screen.findByRole("button", { name: /สิงห์/ }));
  await user.click(screen.getByRole("button", { name: "ส่งออเดอร์" }));
  expect(await screen.findByText("ตะกร้ายังอยู่ครบ — ส่งซ้ำจะไม่เกิดออเดอร์ซ้ำ")).toBeInTheDocument();
  const cart = screen.getByRole("complementary", { name: "ตะกร้า" });
  expect(within(cart).getByRole("button", { name: "เพิ่ม" })).toBeDisabled();
  expect(within(cart).getByRole("button", { name: "ลบรายการ สิงห์" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /^สิงห์/ })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "ส่งอีกครั้ง" }));
  expect(await screen.findByText(/ส่งออเดอร์ T3 แล้ว · 1 รายการ/)).toBeInTheDocument();
  expect(keys).toEqual([keys[0], keys[0]]);
  expect(bodies[1]).toBe(bodies[0]);
  expect(push).toHaveBeenCalledWith(`/pos/tables?visit=${visitId}`);
});

test("a network failure can discard the frozen cart", async () => {
  const user = userEvent.setup();
  server.use(http.post("*/api/visits/:id/orders", () => HttpResponse.error()));
  renderScreen();
  await user.click(await screen.findByRole("button", { name: /สิงห์/ }));
  await user.click(screen.getByRole("button", { name: "ส่งออเดอร์" }));
  await user.click(await screen.findByRole("button", { name: "ทิ้งตะกร้า" }));
  expect(push).toHaveBeenCalledWith(`/pos/tables?visit=${visitId}`);
});

test("a reused key locks the cart and sends nothing further", async () => {
  const user = userEvent.setup();
  let calls = 0;
  server.use(
    http.post("*/api/visits/:id/orders", () => {
      calls += 1;
      return HttpResponse.json(apiEnvelope(null, 409, "IDEMPOTENCY_KEY_REUSED", "ใช้แล้ว"), { status: 409 });
    }),
  );
  renderScreen();
  await user.click(await screen.findByRole("button", { name: /สิงห์/ }));
  await user.click(screen.getByRole("button", { name: "ส่งออเดอร์" }));
  expect(await screen.findByText("ออเดอร์นี้อาจถูกส่งไปแล้ว")).toBeInTheDocument();
  expect(screen.getByText("ตรวจที่โต๊ะก่อนสั่งเพิ่ม")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ส่งออเดอร์" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ส่งอีกครั้ง" })).not.toBeInTheDocument();
  const cart = screen.getByRole("complementary", { name: "ตะกร้า" });
  expect(within(cart).getByRole("button", { name: "เพิ่ม" })).toBeDisabled();
  await user.click(within(cart).getByRole("button", { name: "กลับไปที่โต๊ะ" }));
  expect(calls).toBe(1);
  expect(push).toHaveBeenCalledWith(`/pos/tables?visit=${visitId}`);
});

test("a 409 flags only the returned lines and blocks send until they are removed", async () => {
  const user = userEvent.setup();
  server.use(
    http.post("*/api/visits/:id/orders", () =>
      HttpResponse.json(
        apiEnvelope(
          {
            details: [
              { variantId: mojito, reason: "sold_out" },
              { variantId: large, reason: "out_of_window" },
            ],
          },
          409,
          "ITEM_UNAVAILABLE",
          "สินค้าหมด",
        ),
        { status: 409 },
      ),
    ),
  );
  renderScreen();
  await user.click(await screen.findByRole("button", { name: /สิงห์/ }));
  await user.click(screen.getByRole("button", { name: /^โมฮิโต้/ }));
  await user.click(screen.getByRole("button", { name: /เพิ่มลงตะกร้า/ }));
  await user.click(screen.getByRole("button", { name: /^โมฮิโต้/ }));
  await user.click(screen.getByRole("radio", { name: /ใหญ่/ }));
  await user.click(screen.getByRole("button", { name: /เพิ่มลงตะกร้า/ }));
  await user.click(screen.getByRole("button", { name: "ส่งออเดอร์" }));

  expect(await screen.findByText("ลบออกก่อนจึงจะส่งได้")).toBeInTheDocument();
  const cart = screen.getByRole("complementary", { name: "ตะกร้า" });
  expect(within(cart).getByText("หมด")).toBeInTheDocument();
  expect(within(cart).getByText("หมดเวลาโปร")).toBeInTheDocument();
  expect(within(cart).getAllByText("โมฮิโต้")[0]).toHaveClass("line-through");
  expect(within(cart).getByText("สิงห์")).not.toHaveClass("line-through");
  expect(screen.getByRole("button", { name: "ส่งออเดอร์" })).toBeDisabled();

  const removals = within(cart).getAllByRole("button", { name: /ลบรายการ โมฮิโต้/ });
  await user.click(removals[0]!);
  expect(screen.getByRole("button", { name: "ส่งออเดอร์" })).toBeDisabled();
  await user.click(within(cart).getByRole("button", { name: /ลบรายการ โมฮิโต้/ }));
  expect(screen.getByRole("button", { name: "ส่งออเดอร์" })).toBeEnabled();
  expect(screen.queryByText("ลบออกก่อนจึงจะส่งได้")).not.toBeInTheDocument();
});

test("a closed visit locks the cart and back discards it", async () => {
  const user = userEvent.setup();
  server.use(
    http.post("*/api/visits/:id/orders", () =>
      HttpResponse.json(apiEnvelope(null, 409, "INVALID_STATE_TRANSITION", "ปิดแล้ว"), { status: 409 }),
    ),
  );
  renderScreen();
  await user.click(await screen.findByRole("button", { name: /สิงห์/ }));
  await user.click(screen.getByRole("button", { name: "ส่งออเดอร์" }));
  expect(await screen.findByText("ออเดอร์ไม่ถูกส่ง — กลับไปที่โต๊ะแล้วเลือกใหม่")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "กลับไปที่โต๊ะ" }));
  expect(screen.queryByRole("dialog", { name: "ทิ้งตะกร้า?" })).not.toBeInTheDocument();
  expect(push).toHaveBeenCalledWith(`/pos/tables?visit=${visitId}`);
});

test("back with items asks before discarding the cart", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: /สิงห์/ }));
  await user.click(screen.getByRole("button", { name: "กลับไปที่โต๊ะ" }));
  const dialog = await screen.findByRole("alertdialog", { name: "ทิ้งตะกร้า?" });
  await user.click(within(dialog).getByRole("button", { name: "อยู่ต่อ" }));
  expect(within(screen.getByRole("complementary", { name: "ตะกร้า" })).getByText("สิงห์")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "กลับไปที่โต๊ะ" }));
  await user.click(await screen.findByRole("button", { name: "ทิ้งตะกร้า" }));
  expect(push).toHaveBeenCalledWith(`/pos/tables?visit=${visitId}`);
});
