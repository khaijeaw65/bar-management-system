import { toast } from "@heroui/react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cartReducer, createCart, type NewLine } from "@/lib/order/cart";
import { customerItems } from "@/mocks/customer";
import { server } from "@/mocks/node";
import { saveCart } from "../../_lib/cart-storage";
import { renderCustomer, SEAT } from "../../_lib/test-render";
import { CartScreen } from "./CartScreen";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));

function lineFor(name: string, quantity: number, notes: string | null = null): NewLine {
  const item = customerItems.find((entry) => entry.name === name);
  if (!item) throw new Error(name);
  return {
    itemId: item.id,
    itemName: name,
    variantId: item.variants[0]?.id ?? "",
    variantName: "ปกติ",
    modifierOptionIds: [],
    modifierLabel: "",
    orderedByName: null,
    notes,
    quantity,
    unitPrice: item.basePrice,
  };
}

function seed(...lines: NewLine[]): string {
  const cart = lines.reduce((state, line) => cartReducer(state, { type: "add", line }), createCart());
  saveCart(SEAT, cart);
  return cart.idempotencyKey;
}

beforeEach(() => replace.mockReset());
afterEach(() => {
  toast.clear();
  window.localStorage.clear();
});

test("AC-3: sends one POST with an Idempotency-Key, clears the cart and shows the order number", async () => {
  const key = seed(lineFor("ช้างดราฟต์", 2), lineFor("ถั่วทอดสมุนไพร", 1));
  const requests: { key: string | null; body: unknown }[] = [];
  server.use(
    http.post("*/api/customer/orders", async ({ request }) => {
      requests.push({ key: request.headers.get("Idempotency-Key"), body: await request.json() });
      return HttpResponse.json({ status: 201, code: "", message: "success", data: { orderId: crypto.randomUUID(), orderNumber: 1, visitId: crypto.randomUUID() } }, { status: 201 });
    }),
  );
  const user = userEvent.setup();
  renderCustomer(<CartScreen />);
  expect(await screen.findByText("฿320.00", { selector: "span.text-title" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "สั่งเลย" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/customer/menu"));
  expect(requests).toHaveLength(1);
  expect(requests[0]?.key).toBe(key);
  expect(JSON.stringify(requests[0]?.body)).not.toContain("orderedByName");
  expect(await screen.findByText("ส่งออเดอร์แล้ว · #001")).toBeInTheDocument();
  expect(window.localStorage.getItem(`bar.customer.cart.${SEAT}`)).toBeNull();
});

test("AC-4: a 409 marks the line, blocks the send until it is removed, then the retry succeeds", async () => {
  seed(lineFor("ยำหมูยอ", 1, "หมดทดสอบ"), lineFor("ช้างดราฟต์", 2));
  const user = userEvent.setup();
  renderCustomer(<CartScreen />);
  await user.click(await screen.findByRole("button", { name: "สั่งเลย" }));
  expect(await screen.findByText("หมดแล้ว — ลบออกเพื่อสั่งต่อ")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "สั่งเลย" })).toBeDisabled();
  expect(replace).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "ลบออก ยำหมูยอ" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "สั่งเลย" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "สั่งเลย" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/customer/menu"));
});

test("AC-5: a network failure keeps the cart and the retry reuses the same key", async () => {
  const key = seed(lineFor("ช้างดราฟต์", 1));
  const keys: (string | null)[] = [];
  let calls = 0;
  server.use(
    http.post("*/api/customer/orders", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      calls += 1;
      if (calls === 1) return HttpResponse.error();
      return HttpResponse.json({ status: 201, code: "", message: "success", data: { orderId: crypto.randomUUID(), orderNumber: 7, visitId: crypto.randomUUID() } }, { status: 201 });
    }),
  );
  const user = userEvent.setup();
  renderCustomer(<CartScreen />);
  await user.click(await screen.findByRole("button", { name: "สั่งเลย" }));
  expect(await screen.findByText("สั่งไม่สำเร็จ ลองอีกครั้ง")).toBeInTheDocument();
  expect(screen.getByText("ช้างดราฟต์")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "สั่งเลย" }));
  await waitFor(() => expect(replace).toHaveBeenCalled());
  expect(keys).toEqual([key, key]);
});

test("an empty cart says so and offers the menu", async () => {
  renderCustomer(<CartScreen />);
  expect(await screen.findByText("ตะกร้ายังว่าง")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "เลือกเมนูเพิ่ม" })).toBeInTheDocument();
});
