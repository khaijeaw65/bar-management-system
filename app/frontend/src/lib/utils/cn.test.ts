import { expect, test } from "vitest";
import { cn } from "./cn";

test("keeps a DS type utility beside a text colour utility", () => {
  expect(cn("rounded-btn text-label", "text-text-accent")).toBe(
    "rounded-btn text-label text-text-accent",
  );
  expect(cn("text-small text-text-muted", "font-semibold")).toBe(
    "text-small text-text-muted font-semibold",
  );
});
