import type { CustomerTab } from "@bar/contracts";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { server } from "@/mocks/node";
import { renderCustomer } from "../../_lib/test-render";
import { TabScreen } from "./TabScreen";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

const line = (itemName: string, extra: Partial<CustomerTab["orders"][number]["lines"][number]> = {}) => ({
  itemName,
  variantName: "ปกติ",
  modifiers: [],
  quantity: 1,
  unitPrice: "100.00",
  lineTotal: "100.00",
  orderedByName: null,
  cancelled: false,
  isComp: false,
  ...extra,
});

const tab: CustomerTab = {
  visitId: "c0000000-0000-4000-8000-000000000800",
  total: "300.00",
  asOf: "2026-10-30T13:34:00.000Z",
  orders: [
    { orderNumber: 2, placedAt: "2026-10-30T13:30:00.000Z", mine: false, tickets: [{ station: "bar", status: "cancelled" }, { station: "food", status: "ready" }], lines: [line("ยำหมูยอ", { cancelled: true }), line("ถั่วทอด", { orderedByName: "เอก" })] },
    { orderNumber: 1, placedAt: "2026-10-30T13:20:00.000Z", mine: true, tickets: [{ station: "bar", status: "accepted" }], lines: [line("ช้างดราฟต์")] },
  ],
};

function serve(data: CustomerTab) {
  server.use(http.get("*/api/customer/tab", () => HttpResponse.json({ status: 200, code: "", message: "success", data })));
}

test("AC-3/4: shows whole-table orders with customer labels, struck lines and the total", async () => {
  serve(tab);
  renderCustomer(<TabScreen />);
  expect(await screen.findByText("#002")).toBeInTheDocument();
  expect(screen.getByText("ครัว · พร้อมเสิร์ฟ")).toBeInTheDocument();
  expect(screen.getByText("บาร์ · ร้านกำลังเตรียม")).toBeInTheDocument();
  expect(screen.queryByText(/บาร์ · ยกเลิก/)).not.toBeInTheDocument();
  expect(screen.getByText("รายการถูกยกเลิก")).toBeInTheDocument();
  expect(screen.getByText("สั่งโดย เอก")).toBeInTheDocument();
  expect(screen.getAllByText("สั่งโดย ลูกค้า")).toHaveLength(2);
  expect(screen.getByText("฿300.00")).toBeInTheDocument();
  expect(screen.getByText(/อัปเดต \d\d:\d\d/)).toBeInTheDocument();
});

test("AC-3: ของฉัน keeps only this phone's orders", async () => {
  serve(tab);
  const user = userEvent.setup();
  renderCustomer(<TabScreen />);
  await screen.findByText("#002");
  await user.click(screen.getByRole("button", { name: "ของฉัน" }));
  expect(screen.queryByText("#002")).not.toBeInTheDocument();
  const list = screen.getByText("#001").closest("li");
  expect(within(list as HTMLElement).getByText("ช้างดราฟต์ × 1")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ของฉัน" })).toHaveAttribute("aria-pressed", "true");
});

test("empty tab shows the empty state and สั่งเพิ่ม goes to the menu", async () => {
  serve({ ...tab, orders: [], total: "0.00" });
  const user = userEvent.setup();
  renderCustomer(<TabScreen />);
  expect(await screen.findByText("ยังไม่มีออเดอร์")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "สั่งเพิ่ม" }));
  expect(push).toHaveBeenCalledWith("/customer/menu");
});
