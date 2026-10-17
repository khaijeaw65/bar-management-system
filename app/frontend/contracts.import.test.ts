import { MoneySchema, OrderStatusSchema } from "@bar/contracts";
import { expect, test } from "vitest";

test("imports the built @bar/contracts package", () => {
  expect(MoneySchema.parse("120.00")).toBe("120.00");
  expect(OrderStatusSchema.parse("pending")).toBe("pending");
});
