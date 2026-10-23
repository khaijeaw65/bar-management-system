import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { RevenueChart } from "./RevenueChart";

const days = [
  { date: "2026-10-09", revenue: "12410.00", bills: 17 },
  { date: "2026-10-10", revenue: "24440.00", bills: 32 },
  { date: "2026-10-11", revenue: "26280.50", bills: 36 },
];

test("the chart has a text summary and the table view shows the same numbers", async () => {
  const user = userEvent.setup();
  render(<RevenueChart days={days} />);

  expect(
    screen.getByRole("img", { name: "ยอดขายรายวัน 3 วัน รวม ฿63,130.50 สูงสุด 11 ต.ค. ฿26,280.50" }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "ดูเป็นตาราง" }));

  const table = screen.getByRole("grid", { name: "ยอดขายรายวัน" });
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows.map((row) => row.textContent)).toEqual(["9 ต.ค.฿12,410.0017", "10 ต.ค.฿24,440.0032", "11 ต.ค.฿26,280.5036"]);

  await user.click(screen.getByRole("button", { name: "ดูเป็นกราฟ" }));
  expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: /ยอดขายรายวัน 3 วัน/ })).toBeInTheDocument();
});
