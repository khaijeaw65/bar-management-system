import { expect, test, type Page } from "@playwright/test";

// BRIEF-052 AC tests (UI) — written by the planner against §3 / CD-07 before implementation (trial #36).
// Mock controls used here are the brief's §5 test-harness contract; the executor adds them to the mock layer.

interface CustomerWindow {
  __customerMock: { posPending: () => void; markPaid: () => void; expirePending: () => void };
  __customerSocket: { onTabChanged: (ended: boolean) => void };
}

interface PosWindow {
  __posMock: { ring: (label: string, reason?: "bill" | "other" | "transfer" | null, note?: string | null) => string };
  __staffSocket: { fire: (event: string, payload: unknown) => void };
}

async function orderOne(page: Page) {
  await page.goto("/scan/qr-t3");
  await page.getByRole("button", { name: "ดูเมนู" }).click();
  await page.getByRole("button", { name: "เพิ่ม ช้างดราฟต์" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /เพิ่มลงตะกร้า/ }).click();
  await page.getByRole("button", { name: "ดูตะกร้า" }).click();
  await page.getByRole("button", { name: "สั่งเลย" }).click();
  await expect(page).toHaveURL(/\/customer\/tab$/);
}

const ping = (page: Page) =>
  page.evaluate(() => (window as unknown as CustomerWindow).__customerSocket.onTabChanged(false));

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("AC-10: tab → pay → QR → แจ้งโอนแล้ว → paid live → back to the bill", async ({ page }) => {
    await orderOne(page);
    await page.getByRole("button", { name: "ชำระเงิน" }).click();
    await expect(page).toHaveURL(/\/customer\/pay$/);
    await expect(page.getByText(/ยอดทั้งโต๊ะ ฿/)).toBeVisible();

    await page.getByRole("button", { name: "สร้าง QR พร้อมเพย์" }).click();
    await expect(page.getByRole("img", { name: /QR พร้อมเพย์ ฿.+ โต๊ะ T3/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "บันทึก QR" })).toBeVisible();
    await expect(page.getByText(/เปิดแอปธนาคาร/)).toBeVisible();
    await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible();

    await page.getByRole("button", { name: "แจ้งโอนแล้ว" }).click();
    await expect(page.getByRole("button", { name: /แจ้งพนักงานแล้ว/ })).toBeDisabled();

    await page.evaluate(() => (window as unknown as CustomerWindow).__customerMock.markPaid());
    await ping(page);
    await expect(page.getByText("ชำระเรียบร้อย")).toBeVisible();
    await page.getByRole("button", { name: "กลับไปที่บิล" }).click();
    await expect(page).toHaveURL(/\/customer\/tab$/);
    await expect(page.getByRole("button", { name: "ชำระเงิน" })).toHaveCount(0);
  });

  test("AC-11: someone else's pending QR is view-only; my own can be changed", async ({ page }) => {
    await orderOne(page);
    await page.evaluate(() => (window as unknown as CustomerWindow).__customerMock.posPending());
    await ping(page);
    await page.getByRole("button", { name: "ชำระเงิน" }).click();
    await expect(page.getByRole("button", { name: "สร้าง QR พร้อมเพย์" })).toHaveCount(0);
    await page.getByRole("button", { name: "ดู QR" }).click();
    await expect(page.getByRole("img", { name: /QR พร้อมเพย์/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "เปลี่ยนวิธีจ่าย" })).toHaveCount(0);
  });

  test("AC-11: changing method on my own QR goes back to the intent", async ({ page }) => {
    await orderOne(page);
    await page.getByRole("button", { name: "ชำระเงิน" }).click();
    await page.getByRole("button", { name: "สร้าง QR พร้อมเพย์" }).click();
    await page.getByRole("button", { name: "เปลี่ยนวิธีจ่าย" }).click();
    await expect(page.getByRole("button", { name: "สร้าง QR พร้อมเพย์" })).toBeVisible();
  });

  test("AC-12: an expired QR offers a new one; cash opens the bell preset to เช็คบิล", async ({ page }) => {
    await orderOne(page);
    await page.getByRole("button", { name: "ชำระเงิน" }).click();
    await page.getByRole("button", { name: "สร้าง QR พร้อมเพย์" }).click();
    await page.evaluate(() => (window as unknown as CustomerWindow).__customerMock.expirePending());
    await ping(page);
    await expect(page.getByText("QR หมดอายุ")).toBeVisible();
    await expect(page.getByRole("button", { name: "สร้าง QR ใหม่" })).toBeVisible();

    await page.goto("/customer/pay");
    await page.getByRole("button", { name: "จ่ายเงินสด" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("เรียกพนักงาน")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "เช็คบิล" })).toHaveAttribute("aria-pressed", "true");
  });
});

test("AC-13: a transfer bell reads แจ้งโอนแล้ว with the amount on the POS card", async ({ page }) => {
  await page.goto("/pos/tables");
  await expect(page.getByRole("button", { name: /T3/ }).first()).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as Partial<PosWindow>).__staffSocket));
  await page.evaluate(() => {
    const w = window as unknown as PosWindow;
    const seatId = w.__posMock.ring("T3", "transfer", "1240.00");
    w.__staffSocket.fire("table.staff_called", {
      tableSeatId: seatId,
      reason: "transfer",
      note: "1240.00",
      calledAt: new Date().toISOString(),
    });
  });
  await expect(page.getByText(/แจ้งโอนแล้ว ฿1,240\.00/).first()).toBeVisible();
});
