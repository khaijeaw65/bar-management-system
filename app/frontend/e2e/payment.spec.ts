import { expect, test } from "@playwright/test";

test("creates a QR, confirms by hand and lands back on a paid, open table", async ({ page }) => {
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: /T3/ }).click();
  const drawer = page.getByRole("complementary", { name: "โต๊ะ T3" });
  await drawer.getByRole("button", { name: "ชำระเงิน" }).click();

  const checkout = page.getByRole("dialog").last();
  const created = page.waitForRequest((request) => request.method() === "POST" && request.url().includes("/payments"));
  await checkout.getByRole("button", { name: "สร้าง QR" }).click();
  expect((await created).headers()["idempotency-key"]).toMatch(/[0-9a-f-]{36}/);
  await expect(checkout.getByText(/หมดเวลาใน/)).toBeVisible();

  await checkout.getByRole("button", { name: "ยืนยันด้วยตนเอง" }).click();
  await checkout.getByRole("button", { name: /เหตุผล|เลือก/ }).click();
  await page.getByRole("option", { name: "ลูกค้าโอนเข้าบัญชีร้านโดยตรง" }).click();
  await checkout.getByRole("button", { name: "ยืนยันว่าชำระแล้ว" }).click();
  await expect(checkout.getByText(/ชำระแล้ว ฿/)).toBeVisible();
  await expect(page.getByText("ยืนยันด้วยตนเอง · บันทึกให้เจ้าของตรวจสอบแล้ว")).toBeVisible();

  await checkout.getByRole("button", { name: "ไปที่สรุป" }).click();
  await expect(drawer.getByText("ชำระครบแล้ว")).toBeVisible();
  await expect(page.getByRole("button", { name: /T3/ })).toBeVisible();
});
