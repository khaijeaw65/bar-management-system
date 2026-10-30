import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { server } from "@/mocks/node";
import { renderCustomer } from "../../_lib/test-render";
import { PayScreen } from "./PayScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const pending = {
  id: "c0000000-0000-4000-8000-000000000950",
  amount: "240.00",
  qrPayload: "payload",
  expiresAt: "2099-01-01T00:00:00.000Z",
  mine: false,
  createdAt: "2026-10-30T10:00:00.000Z",
};

function serve(bill: { total: string; paid: string; remaining: string }, current: typeof pending | null, locked = current !== null) {
  const data = { bill: { ...bill, locked }, pending: current };
  server.use(http.get("*/api/customer/payment", () => HttpResponse.json({ status: 200, code: "", message: "success", data })));
}

test("offers the QR and cash while nothing is pending", async () => {
  serve({ total: "240.00", paid: "0.00", remaining: "240.00" }, null);
  renderCustomer(<PayScreen />);
  expect(await screen.findByText("ยอดทั้งโต๊ะ ฿240.00")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "สร้าง QR พร้อมเพย์" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "จ่ายเงินสด" })).toBeInTheDocument();
});

test("offers only to view a QR somebody else started", async () => {
  serve({ total: "240.00", paid: "0.00", remaining: "240.00" }, pending);
  renderCustomer(<PayScreen />);
  expect(await screen.findByRole("button", { name: "ดู QR" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "สร้าง QR พร้อมเพย์" })).not.toBeInTheDocument();
});

test("says paid once the whole bill is covered", async () => {
  serve({ total: "240.00", paid: "240.00", remaining: "0.00" }, null);
  renderCustomer(<PayScreen />);
  expect(await screen.findByText("ชำระเรียบร้อย")).toBeInTheDocument();
});

test("a locked bill with nothing to show says staff are settling it and offers no QR", async () => {
  serve({ total: "240.00", paid: "0.00", remaining: "240.00" }, null, true);
  renderCustomer(<PayScreen />);
  expect(await screen.findByText("พนักงานกำลังเช็คบิลให้โต๊ะนี้")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "สร้าง QR พร้อมเพย์" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ดู QR" })).not.toBeInTheDocument();
});
