import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { PromptPayPending } from "./PromptPayPending";

vi.mock("./PromptPayQr", () => ({ PromptPayQr: () => null }));

const payment = {
  id: "50000000-0000-4000-8000-000000000001",
  amount: "240.00",
  qrPayload: "000201",
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
} as never;

function renderPending(onManual: (() => void) | null) {
  render(
    <PromptPayPending
      payment={payment}
      socketDown={false}
      pending={false}
      expired={false}
      fault={null}
      onCancel={() => undefined}
      onManual={onManual}
      onNew={() => undefined}
      onVerified={() => undefined}
    />,
  );
}

test("with payments:mark_paid the manual confirm button is there", () => {
  renderPending(() => undefined);
  expect(screen.getByRole("button", { name: "ยืนยันด้วยตนเอง" })).toBeInTheDocument();
  expect(screen.queryByText("ให้ผู้จัดการยืนยันรับเงิน")).not.toBeInTheDocument();
});

test("without it the button is replaced by the hint, and slip scan and cancel stay", () => {
  renderPending(null);
  expect(screen.queryByRole("button", { name: "ยืนยันด้วยตนเอง" })).not.toBeInTheDocument();
  expect(screen.getByText("ให้ผู้จัดการยืนยันรับเงิน")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "สแกนสลิป" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ยกเลิก QR" })).toBeInTheDocument();
});
