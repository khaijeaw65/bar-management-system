import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { MenuScreen } from "./MenuScreen";

const cocktail = "ค็อกเทลพิเศษประจำเดือน “ฝนแรกที่บางกอก” จินมะลิ ส้มซ่า โซดาตะไคร้";

function renderScreen() {
  render(<MenuScreen />);
}

function categoryRow(label: string) {
  return within(screen.getByRole("navigation", { name: "หมวดเมนู" })).getByRole("row", { name: label });
}

test("renders the four menu cards", () => {
  renderScreen();
  expect(screen.getByText("ช้างดราฟต์")).toBeInTheDocument();
  expect(screen.getByText(cocktail)).toBeInTheDocument();
  expect(screen.getByText("ไฮบอลมะนาวโซดา")).toBeInTheDocument();
  expect(screen.getByText("ยำหมูยอ")).toBeInTheDocument();
  expect(screen.getByText("แสดง 4 รายการ")).toHaveClass("tabular-nums");
  expect(screen.getByText("หมด")).toBeInTheDocument();
  expect(categoryRow("ทั้งหมด")).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("navigation", { name: "หมวดเมนู" })).toHaveTextContent(/ทั้งหมด\s*4/);
});

test("filters by a trimmed Thai substring and keeps category counts", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.type(screen.getByRole("searchbox", { name: "ค้นหาเมนู" }), " ช้าง ");
  expect(screen.getByText("ช้างดราฟต์")).toBeInTheDocument();
  expect(screen.queryByText("ยำหมูยอ")).not.toBeInTheDocument();
  expect(screen.getByText("แสดง 1 รายการ")).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "หมวดเมนู" })).toHaveTextContent(/ทั้งหมด\s*4/);
});

test("filters to the sold-out food item", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(categoryRow("อาหาร"));
  const card = screen.getByText("ยำหมูยอ").closest("[data-slot='card']");
  expect(card).toHaveClass("opacity-50");
  expect(within(card as HTMLElement).getByText("หมด")).toBeInTheDocument();
  expect(screen.queryByText("ช้างดราฟต์")).not.toBeInTheDocument();
  expect(screen.getByText("แสดง 1 รายการ")).toBeInTheDocument();
  expect(categoryRow("อาหาร")).toHaveAttribute("aria-selected", "true");
});

test("shows the empty state and both clears restore the grid without changing category", async () => {
  const user = userEvent.setup();
  renderScreen();
  const search = screen.getByRole("searchbox", { name: "ค้นหาเมนู" });
  await user.type(search, "มาร์การิต้า");
  expect(screen.getByText("ไม่พบผลลัพธ์สำหรับ “มาร์การิต้า”")).not.toHaveClass("tabular-nums");
  expect(screen.getByText("ไม่พบเมนูที่ค้นหา")).toBeInTheDocument();
  expect(screen.getByText("ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหาเพื่อดูเมนูทั้งหมด")).toBeInTheDocument();

  const textClear = screen
    .getAllByRole("button", { name: "ล้างคำค้นหา" })
    .find((button) => button.textContent?.includes("ล้างคำค้นหา"));
  await user.click(textClear as HTMLElement);
  expect(screen.getByText("แสดง 4 รายการ")).toBeInTheDocument();
  expect(categoryRow("ทั้งหมด")).toHaveAttribute("aria-selected", "true");

  await user.click(categoryRow("อาหาร"));
  await user.type(search, "มาร์การิต้า");
  expect(screen.getByText("ไม่พบเมนูที่ค้นหา")).toBeInTheDocument();
  const fieldClear = screen
    .getAllByRole("button", { name: "ล้างคำค้นหา" })
    .find((button) => !button.textContent?.includes("ล้างคำค้นหา"));
  await user.click(fieldClear as HTMLElement);
  expect(screen.getByText("ยำหมูยอ")).toBeInTheDocument();
  expect(screen.queryByText("ช้างดราฟต์")).not.toBeInTheDocument();
  expect(categoryRow("อาหาร")).toHaveAttribute("aria-selected", "true");

  await user.type(search, "มาร์การิต้า");
  await user.keyboard("{Escape}");
  expect(screen.getByText("ยำหมูยอ")).toBeInTheDocument();
  expect(categoryRow("อาหาร")).toHaveAttribute("aria-selected", "true");
});
