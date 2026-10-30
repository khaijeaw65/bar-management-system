import { expect, test } from "vitest";
import { clockText, secondsLeft } from "./countdown";

test("counts down to zero and never below", () => {
  const expires = "2026-10-30T10:15:00.000Z";
  expect(secondsLeft(expires, Date.parse("2026-10-30T10:00:00.000Z"))).toBe(900);
  expect(secondsLeft(expires, Date.parse("2026-10-30T10:14:59.400Z"))).toBe(1);
  expect(secondsLeft(expires, Date.parse("2026-10-30T10:16:00.000Z"))).toBe(0);
});

test("formats mm:ss", () => {
  expect(clockText(900)).toBe("15:00");
  expect(clockText(59)).toBe("00:59");
});
