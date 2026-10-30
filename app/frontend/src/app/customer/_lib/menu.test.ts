import { expect, test } from "vitest";
import { cartReducer, createCart, type NewLine } from "@/lib/order/cart";
import { customerItems } from "@/mocks/customer";
import { ALL, countInCart, customerBody, hasOptions, plainLine, statusLabel, visibleItems, windowNote } from "./menu";

const byName = (name: string) => {
  const found = customerItems.find((item) => item.name === name);
  if (!found) throw new Error(name);
  return found;
};

function lineFor(name: string, extra: Partial<NewLine> = {}): NewLine {
  const item = byName(name);
  return {
    itemId: item.id,
    itemName: name,
    variantId: item.variants[0]?.id ?? "",
    variantName: "ปกติ",
    modifierOptionIds: [],
    modifierLabel: "",
    orderedByName: "ต้น",
    notes: null,
    quantity: 1,
    unitPrice: item.basePrice,
    ...extra,
  };
}

test("filters by category, promo, and a trimmed Thai substring", () => {
  expect(visibleItems(customerItems, ALL, "")).toHaveLength(customerItems.length);
  expect(visibleItems(customerItems, ALL, "  ถั่ว ").map((item) => item.name)).toEqual(["ถั่วทอดสมุนไพร"]);
  expect(visibleItems(customerItems, byName("ยำหมูยอ").categoryId, "")).toHaveLength(3);
});

test("labels sold-out, out-of-window and live promo items", () => {
  expect(statusLabel(byName("วิสกี้ซาวร์"))).toBe("หมด");
  expect(statusLabel(byName("ปีกไก่ทอด"))).toBe("โปร · เริ่ม 22:00");
  expect(statusLabel(byName("บัคเก็ตโปร"))).toBeNull();
  expect(windowNote(byName("บัคเก็ตโปร"))).toBe("โปร · ถึง 21:00");
  expect(windowNote(byName("ช้างดราฟต์"))).toBeNull();
});

test("only an item with variants or modifier groups gets the full sheet", () => {
  expect(hasOptions(byName("ช้างดราฟต์"))).toBe(false);
  expect(hasOptions(byName("โอลด์แฟชั่น"))).toBe(true);
});

test("the guest body drops orderedByName and flagged lines", () => {
  let cart = cartReducer(createCart(), { type: "add", line: lineFor("ช้างดราฟต์", { quantity: 2, notes: "เย็นจัด" }) });
  cart = cartReducer(cart, { type: "add", line: lineFor("ยำหมูยอ") });
  const flagged = cart.lines.find((line) => line.itemName === "ยำหมูยอ");
  cart = cartReducer(cart, { type: "unavailable", details: [{ variantId: flagged?.variantId ?? "", reason: "sold_out" }] });
  const body = customerBody(cart.lines);
  expect(body.items).toEqual([
    { variantId: byName("ช้างดราฟต์").variants[0]?.id, quantity: 2, modifierOptionIds: [], notes: "เย็นจัด" },
  ]);
  expect(body.items[0]).not.toHaveProperty("orderedByName");
});

test("finds the guest's plain line and counts the item in the cart", () => {
  const cart = cartReducer(createCart(), { type: "add", line: lineFor("ช้างดราฟต์", { quantity: 3 }) });
  const id = byName("ช้างดราฟต์").id;
  expect(plainLine(cart.lines, id)?.quantity).toBe(3);
  expect(countInCart(cart.lines, id)).toBe(3);
  expect(plainLine(cart.lines, byName("ยำหมูยอ").id)).toBeUndefined();
});
