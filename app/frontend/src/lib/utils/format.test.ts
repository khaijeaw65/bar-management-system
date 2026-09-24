import { expect, test } from "vitest";
import { formatTHB } from "./format";

test("formats a decimal string as Thai baht", () => {
  expect(formatTHB("1234.50")).toBe("฿1,234.50");
});
