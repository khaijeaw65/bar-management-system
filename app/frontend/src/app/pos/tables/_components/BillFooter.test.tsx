import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { BillFooter } from "./BillFooter";

const bill = { total: "240.00", paid: "0.00", remaining: "240.00", locked: false };

function renderFooter(canPay: boolean, canClose: boolean) {
  render(<BillFooter bill={bill} locked={false} canPay={canPay} canClose={canClose} onPay={() => undefined} onCloseTable={() => undefined} />);
}

test("shows both buttons when the person may pay and close", () => {
  renderFooter(true, true);
  expect(screen.getByRole("button", { name: "ชำระเงิน" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ปิดโต๊ะ" })).toBeInTheDocument();
});

test("hides ชำระเงิน without payments:create and ปิดโต๊ะ without visits:close, keeping the totals", () => {
  renderFooter(false, false);
  expect(screen.queryByRole("button", { name: "ชำระเงิน" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ปิดโต๊ะ" })).not.toBeInTheDocument();
  expect(screen.getByText("คงเหลือ")).toBeInTheDocument();
});
