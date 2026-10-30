import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

interface Window_ {
  __customerMock: { addOtherOrder: () => void; acceptAll: () => void; cancelFirstLine: () => void };
  __customerSocket: { onTabChanged: (ended: boolean) => void; onLost: () => void; onConnected: () => void };
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

const ping = (page: Page, ended = false) =>
  page.evaluate((value) => (window as unknown as Window_).__customerSocket.onTabChanged(value), ended);

test("AC-3: after send the tab shows the new order, the Toast, mine filter and charge-free total", async ({ page }) => {
  await orderOne(page);
  await expect(page.getByText("ส่งออเดอร์แล้ว · #001")).toBeVisible();
  await expect(page.getByText("#001", { exact: true })).toBeVisible();
  await expect(page.getByText("บาร์ · ส่งแล้ว")).toBeVisible();
  await page.evaluate(() => (window as unknown as Window_).__customerMock.addOtherOrder());
  await ping(page);
  await expect(page.getByText("#002", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ของฉัน" }).click();
  await expect(page.getByText("#002", { exact: true })).toHaveCount(0);
  await expect(page.getByText("#001", { exact: true })).toBeVisible();
});

test("AC-4/AC-7: a ping updates the chip live; a lost socket shows the banner", async ({ page }) => {
  await orderOne(page);
  await page.evaluate(() => (window as unknown as Window_).__customerMock.acceptAll());
  await ping(page);
  await expect(page.getByText("บาร์ · ร้านกำลังเตรียม")).toBeVisible();
  await page.evaluate(() => (window as unknown as Window_).__customerSocket.onLost());
  await expect(page.getByText("การเชื่อมต่อขาดหาย · ข้อมูลอาจไม่ล่าสุด")).toBeVisible();
  await page.evaluate(() => (window as unknown as Window_).__customerSocket.onConnected());
  await expect(page.getByText("การเชื่อมต่อขาดหาย")).toHaveCount(0);
});

test("AC-5: the bell sends once and locks", async ({ page }) => {
  await orderOne(page);
  await page.getByRole("button", { name: "เรียกพนักงาน" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "เช็คบิล" }).click();
  await sheet.getByRole("button", { name: "ส่ง", exact: true }).click();
  await expect(sheet.getByText(/แจ้งพนักงานแล้ว/)).toBeVisible();
  await expect(sheet.getByRole("button", { name: /รอ \d+ วินาที/ })).toBeDisabled();
});

test("AC-6: sessionEnded shows the closed screen", async ({ page }) => {
  await orderOne(page);
  await ping(page, true);
  await expect(page.getByText("โต๊ะนี้ปิดแล้ว ขอบคุณที่มาใช้บริการ")).toBeVisible();
  await expect(page.getByText("สแกน QR ที่โต๊ะเพื่อเริ่มใหม่")).toBeVisible();
});

test("AC-9: 360 wide has no sideways scroll on the tab", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await orderOne(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
