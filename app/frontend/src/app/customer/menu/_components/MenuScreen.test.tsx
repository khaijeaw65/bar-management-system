import { toast } from "@heroui/react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { renderCustomer } from "../../_lib/test-render";
import { MenuScreen } from "./MenuScreen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  toast.clear();
  window.localStorage.clear();
});

async function renderMenu() {
  renderCustomer(<MenuScreen />);
  await screen.findByRole("button", { name: "ดู ช้างดราฟต์" });
}

test("AC-6: promo shows its price as-is, out-of-window is greyed with its start, sold-out says หมด", async () => {
  const user = userEvent.setup();
  await renderMenu();
  expect(screen.getAllByText("฿399.00")).toHaveLength(1);
  expect(screen.getByText("โปร · ถึง 21:00")).toBeInTheDocument();
  expect(document.querySelector(".line-through")).toBeNull();

  expect(screen.getByRole("button", { name: "ดู ปีกไก่ทอด" })).toBeDisabled();
  expect(screen.getByText("โปร · เริ่ม 22:00")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "เพิ่ม ปีกไก่ทอด" })).not.toBeInTheDocument();

  expect(screen.getByRole("button", { name: "ดู วิสกี้ซาวร์" })).toBeDisabled();
  expect(screen.getByText("หมด")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "เพิ่ม วิสกี้ซาวร์" })).not.toBeInTheDocument();

  await user.type(screen.getByRole("searchbox", { name: "ค้นหาเมนู" }), "ถั่ว");
  expect(screen.getByRole("button", { name: "ดู ถั่วทอดสมุนไพร" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ดู ช้างดราฟต์" })).not.toBeInTheDocument();
});

test("AC-6: category chips filter and ทั้งหมด restores", async () => {
  const user = userEvent.setup();
  await renderMenu();
  await user.click(screen.getByRole("button", { name: "อาหาร" }));
  expect(screen.queryByRole("button", { name: "ดู ช้างดราฟต์" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ดู ยำหมูยอ" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "ทั้งหมด" }));
  expect(screen.getByRole("button", { name: "ดู ช้างดราฟต์" })).toBeInTheDocument();
});

test("AC-3: + opens a half sheet with quantity, then the cart bar shows count and total", async () => {
  const user = userEvent.setup();
  await renderMenu();
  await user.click(screen.getByRole("button", { name: "เพิ่ม ช้างดราฟต์" }));
  const sheet = await screen.findByRole("dialog");
  await user.click(within(sheet).getByRole("button", { name: "เพิ่ม" }));
  await user.click(within(sheet).getByRole("button", { name: "เพิ่มลงตะกร้า · ฿240.00" }));
  expect(await screen.findByText("ตะกร้า 2 รายการ")).toBeInTheDocument();
  expect(screen.getByText("฿240.00")).toBeInTheDocument();
});

test("AC-3: an item with a required option stays blocked until it is chosen", async () => {
  const user = userEvent.setup();
  await renderMenu();
  await user.click(screen.getByRole("button", { name: "เพิ่ม โอลด์แฟชั่น" }));
  const sheet = await screen.findByRole("dialog");
  const add = within(sheet).getByRole("button", { name: /เพิ่มลงตะกร้า/ });
  expect(add).toBeDisabled();
  expect(within(sheet).getByText("กรุณาเลือกระดับน้ำแข็ง")).toBeInTheDocument();
  await user.click(within(sheet).getByRole("radio", { name: "น้ำแข็งน้อย" }));
  await waitFor(() => expect(add).toBeEnabled());
  await user.click(add);
  expect(await screen.findByText("ตะกร้า 1 รายการ")).toBeInTheDocument();
});

test("R2: an item already in the cart reopens at its quantity and qty 0 removes it", async () => {
  const user = userEvent.setup();
  await renderMenu();
  await user.click(screen.getByRole("button", { name: "เพิ่ม ช้างดราฟต์" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /เพิ่มลงตะกร้า/ }));
  await screen.findByText("ตะกร้า 1 รายการ");

  await user.click(screen.getByRole("button", { name: "เพิ่ม ช้างดราฟต์" }));
  const sheet = await screen.findByRole("dialog");
  expect(within(sheet).getByRole("button", { name: "อัปเดตตะกร้า · ฿120.00" })).toBeInTheDocument();
  await user.click(within(sheet).getByRole("button", { name: "ลด" }));
  await user.click(within(sheet).getByRole("button", { name: "ลบออกจากตะกร้า" }));
  await waitFor(() => expect(screen.queryByText("ตะกร้า 1 รายการ")).not.toBeInTheDocument());
});
