import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { LiveClock } from "./LiveClock";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T06:30:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

test("shows Bangkok time and updates at the next minute", async () => {
  render(<LiveClock />);
  expect(screen.getByText("13:30 น.")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });

  expect(screen.getByText("13:31 น.")).toBeInTheDocument();
});
