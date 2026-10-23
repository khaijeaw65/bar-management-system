import type { MenuItem } from "@bar/contracts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { menuItems } from "@/mocks/handlers";
import { MenuPanel } from "./MenuPanel";

function renderPanel(extra: Partial<Parameters<typeof MenuPanel>[0]> = {}) {
  const onPick = vi.fn();
  const onRetry = vi.fn();
  render(
    <MenuPanel
      items={menuItems}
      categories={[
        { id: "c1111111-1111-4111-8111-111111111111", name: "เบียร์", sortOrder: 0, isActive: true },
        { id: "c2222222-2222-4222-8222-222222222222", name: "ค็อกเทล", sortOrder: 1, isActive: true },
      ]}
      counts={new Map()}
      query=""
      categoryId="all"
      status="ready"
      disconnected={false}
      locked={false}
      onQuery={vi.fn()}
      onCategory={vi.fn()}
      onRetry={onRetry}
      onPick={onPick}
      {...extra}
    />,
  );
  return { onPick, onRetry };
}

test("a sold-out tile is inert and a promo shows its next window", () => {
  renderPanel();
  expect(screen.getByRole("button", { name: /วิสกี้ซาวร์ หมด/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /ปีกไก่ทอด โปร · เริ่ม 22:00/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /สิงห์/ })).toBeEnabled();
});

test("hides charge items and shows the search miss", () => {
  const charge: MenuItem = { ...menuItems[0], id: "99999999-9999-4999-8999-999999999999", name: "ค่าเปิดขวด", itemType: "charge" };
  const onQuery = vi.fn();
  renderPanel({ items: [...menuItems, charge], query: "มาร์การิต้า", onQuery });
  expect(screen.queryByRole("button", { name: /ค่าเปิดขวด/ })).not.toBeInTheDocument();
  expect(screen.getByText("ไม่พบเมนูที่ค้นหา")).toBeInTheDocument();
  expect(screen.getByText("ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง")).toBeInTheDocument();
});

test("shows a loading menu", () => {
  renderPanel({ status: "loading", items: [] });
  expect(screen.getByText("กำลังโหลดเมนู")).toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: "ค้นหาเมนู" })).toBeDisabled();
});

test("error retry and the disconnected alert", async () => {
  const user = userEvent.setup();
  const { onRetry } = renderPanel({ status: "error", items: [], disconnected: true });
  expect(screen.getByText("โหลดเมนูไม่สำเร็จ")).toBeInTheDocument();
  expect(screen.getByText(/สถานะเมนูอาจไม่ล่าสุด/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(onRetry).toHaveBeenCalledOnce();
});
