import type { UnavailableReason } from "@bar/contracts";
import { expect, test } from "vitest";
import { cartReducer, createCart, previewOf, sendFailure, type NewLine } from "../cart";
import { ApiError } from "@/lib/api/errors";

function line(price = "120.00", quantity = 1, extra: Partial<NewLine> = {}): NewLine {
  return {
    itemId: "11111111-1111-4111-8111-111111111111",
    itemName: "สิงห์",
    variantId: "11111111-1111-4111-8111-111111111111",
    variantName: "ปกติ",
    modifierOptionIds: [],
    modifierLabel: "",
    orderedByName: null,
    notes: null,
    quantity,
    unitPrice: price,
    ...extra,
  };
}

test("two quick adds merge, and undo removes only the last one", () => {
  let state = createCart();
  state = cartReducer(state, { type: "add", line: line() });
  state = cartReducer(state, { type: "add", line: line() });
  expect(state.lines).toHaveLength(1);
  expect(state.lines[0]?.quantity).toBe(2);
  state = cartReducer(state, { type: "undo" });
  expect(state.lines[0]?.quantity).toBe(1);
});

test("a preview of 3 × ฿33.33 is ฿99.99 and drops flagged lines", () => {
  let state = cartReducer(createCart(), { type: "add", line: line("33.33", 3) });
  expect(previewOf(state.lines)).toEqual({ total: "99.99", count: 3 });
  state = cartReducer(state, {
    type: "unavailable",
    details: [{ variantId: "11111111-1111-4111-8111-111111111111", reason: "sold_out" }],
  });
  expect(state.lines[0]?.unavailable).toBe("sold_out");
  expect(previewOf(state.lines)).toEqual({ total: "0.00", count: 0 });
});

test("a network failure freezes the cart and a reused key stays", () => {
  let state = cartReducer(createCart(), { type: "add", line: line() });
  const key = state.idempotencyKey;
  const id = state.lines[0]?.id ?? "";
  state = cartReducer(state, { type: "network" });
  state = cartReducer(state, { type: "add", line: line() });
  state = cartReducer(state, { type: "qty", id, quantity: 4 });
  state = cartReducer(state, { type: "undo" });
  state = cartReducer(state, { type: "remove", id });
  state = cartReducer(state, { type: "rememberName", name: "นิด" });
  expect(state.idempotencyKey).toBe(key);
  expect(state.lines).toEqual([expect.objectContaining({ quantity: 1 })]);
  expect(state.names).toEqual([]);
  const reused = cartReducer(state, { type: "reused" });
  expect(reused.idempotencyKey).toBe(key);
  expect(reused.notice).toBe("reused");
  expect(cartReducer(reused, { type: "add", line: line() }).lines).toHaveLength(1);
  const closed = cartReducer(cartReducer(createCart(), { type: "closed" }), { type: "add", line: line() });
  expect(closed.lines).toHaveLength(0);
  expect(closed.closed).toBe(true);
});

test("maps send failures onto cart actions", () => {
  const soldOut: UnavailableReason = "sold_out";
  const details = [{ variantId: "11111111-1111-4111-8111-111111111111", reason: soldOut }];
  expect(sendFailure(new ApiError(409, "ITEM_UNAVAILABLE", "หมด", { details }))).toEqual({
    type: "unavailable",
    details,
  });
  expect(sendFailure(new ApiError(409, "INVALID_STATE_TRANSITION", "ปิด", null)).type).toBe("closed");
  expect(sendFailure(new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "ซ้ำ", null)).type).toBe("reused");
  expect(sendFailure(new ApiError(403, "FORBIDDEN", "ไม่มีสิทธิ์", null)).type).toBe("forbidden");
  expect(sendFailure(new ApiError(0, "NETWORK_ERROR", "หลุด", null)).type).toBe("network");
});
