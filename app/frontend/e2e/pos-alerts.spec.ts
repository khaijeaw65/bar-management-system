import { expect, test, type Page } from "@playwright/test";

interface PosWindow {
  __posMock: {
    ring: (label: string, reason?: "bill" | "other" | null, note?: string | null) => string;
    guestOrder: (label: string, orderNumber: number) => Record<string, unknown>;
  };
  __staffSocket: { fire: (event: string, payload: unknown) => void };
}

async function openFloor(page: Page) {
  await page.goto("/pos/tables");
  await expect(page.getByRole("button", { name: /T3/ }).first()).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as Partial<PosWindow>).__staffSocket));
}

test("AC-4: a guest order toasts and badges the seat; a staff order stays quiet", async ({ page }) => {
  await openFloor(page);
  await expect(page.getByText("ออเดอร์ใหม่ 1")).toBeVisible();
  await page.evaluate(() => {
    const w = window as unknown as PosWindow;
    w.__staffSocket.fire("order.created", w.__posMock.guestOrder("T3", 7));
  });
  await expect(page.getByText("ออเดอร์ใหม่จาก QR · T3 · #007")).toBeVisible();
  await expect(page.getByRole("button", { name: "ดูออเดอร์" })).toBeVisible();
  await expect(page.getByText("ออเดอร์ใหม่ 2")).toBeVisible();

  await page.evaluate(() => {
    const w = window as unknown as PosWindow;
    const order = w.__posMock.guestOrder("T3", 8);
    w.__staffSocket.fire("order.created", { ...order, createdBy: { staffId: "11111111-1111-4111-8111-111111111111", displayName: "นุ่น" } });
  });
  await expect(page.getByText("ออเดอร์ใหม่จาก QR · T3 · #008")).toHaveCount(0);
});

test("AC-1/AC-2: the bell reaches the card and the top-bar list; รับทราบ clears both", async ({ page }) => {
  await openFloor(page);
  await page.evaluate(() => {
    const w = window as unknown as PosWindow;
    const seatId = w.__posMock.ring("T3", "bill");
    w.__staffSocket.fire("table.staff_called", { tableSeatId: seatId, reason: "bill", note: null, calledAt: new Date().toISOString() });
  });
  await expect(page.getByText("T3 เรียกพนักงาน · เช็คบิล")).toBeVisible();
  await expect(page.getByText(/เรียกพนักงาน · เช็คบิล · เมื่อกี้/)).toBeVisible();

  await page.getByRole("button", { name: "การเรียกพนักงาน 1 รายการ" }).click();
  const list = page.getByRole("dialog", { name: "การเรียกพนักงาน" });
  await expect(list.getByText("T3 เรียกพนักงาน · เช็คบิล · เมื่อกี้")).toBeVisible();
  await list.getByRole("button", { name: "รับทราบ T3" }).click();
  await expect(list.getByText("ไม่มีการเรียก")).toBeVisible();
  await expect(page.getByRole("button", { name: "รับทราบ T3" })).toHaveCount(0);
});
