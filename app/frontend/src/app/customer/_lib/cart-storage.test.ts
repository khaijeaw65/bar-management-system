import { afterEach, expect, test, vi } from "vitest";
import { cartReducer, createCart, type NewLine } from "@/lib/order/cart";
import { loadCart, saveCart } from "./cart-storage";

const line: NewLine = {
  itemId: "c0000000-0000-4000-8000-000000000010",
  itemName: "ช้างดราฟต์",
  variantId: "c0000000-0000-4000-8000-000000000110",
  variantName: "ปกติ",
  modifierOptionIds: [],
  modifierLabel: "",
  orderedByName: null,
  notes: null,
  quantity: 2,
  unitPrice: "120.00",
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

test("a cart survives a reload with its idempotency key", () => {
  const cart = cartReducer(createCart(), { type: "add", line });
  saveCart("seat-1", cart);
  const restored = loadCart("seat-1");
  expect(restored.lines).toHaveLength(1);
  expect(restored.lines[0]?.quantity).toBe(2);
  expect(restored.idempotencyKey).toBe(cart.idempotencyKey);
  expect(window.localStorage.getItem("bar.customer.cart.seat-1")).not.toBeNull();
});

test("carts are kept per session key", () => {
  saveCart("seat-1", cartReducer(createCart(), { type: "add", line }));
  expect(loadCart("seat-2").lines).toEqual([]);
});

test("an emptied cart removes its key", () => {
  saveCart("seat-1", cartReducer(createCart(), { type: "add", line }));
  saveCart("seat-1", createCart());
  expect(window.localStorage.getItem("bar.customer.cart.seat-1")).toBeNull();
});

test("a corrupt value starts a fresh cart", () => {
  window.localStorage.setItem("bar.customer.cart.seat-1", "{not json");
  expect(loadCart("seat-1").lines).toEqual([]);
  window.localStorage.setItem("bar.customer.cart.seat-1", JSON.stringify({ lines: [{ id: 1 }] }));
  expect(loadCart("seat-1").lines).toEqual([]);
});

test("blocked storage never throws and the cart still works in memory", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const cart = cartReducer(loadCart("seat-1"), { type: "add", line });
  expect(() => saveCart("seat-1", cart)).not.toThrow();
  expect(cart.lines).toHaveLength(1);
});
