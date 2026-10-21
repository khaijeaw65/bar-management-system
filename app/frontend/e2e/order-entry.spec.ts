import { expect, test } from "@playwright/test";

const visitId = "20000000-0000-4000-8000-000000000003";

test("sends one order and returns to the drawer", async ({ page }) => {
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: /T3/ }).click();
  await page.getByRole("dialog", { name: "โต๊ะ T3" }).getByRole("button", { name: "สั่งแทนลูกค้า" }).click();
  await expect(page).toHaveURL(new RegExp(`/pos/tables/${visitId}/order`));

  const singha = page.getByRole("button", { name: /^สิงห์/ });
  await singha.click();
  await singha.click();
  await expect(page.getByText("เพิ่ม สิงห์ แล้ว").first()).toBeVisible();
  await page.getByRole("button", { name: /^โมฮิโต้/ }).click();
  await page.getByRole("button", { name: /เพิ่มลงตะกร้า/ }).click();

  const sent = page.waitForRequest((request) => request.method() === "POST" && request.url().includes("/orders"));
  await page.getByRole("button", { name: "ส่งออเดอร์" }).click();
  const request = await sent;
  expect(request.headers()["idempotency-key"]).toMatch(/[0-9a-f-]{36}/);

  await expect(page).toHaveURL(new RegExp(`visit=${visitId}`));
  await expect(page.getByText("ส่งออเดอร์ T3 แล้ว · 3 รายการ")).toBeVisible();
  const drawer = page.getByRole("dialog", { name: "โต๊ะ T3" });
  await expect(drawer.getByText(/สิงห์/)).toBeVisible();
  await expect(drawer.getByText(/โมฮิโต้/)).toBeVisible();
});

test("a stale send flags the unavailable lines", async ({ page }) => {
  await page.goto(`/pos/tables/${visitId}/order`);
  await page.getByRole("button", { name: /^สิงห์/ }).click();
  await page.getByRole("button", { name: /^โมฮิโต้/ }).click();
  await page.getByRole("textbox", { name: "หมายเหตุ (ไม่บังคับ)" }).fill("หมดทดสอบ");
  await page.getByRole("button", { name: /เพิ่มลงตะกร้า/ }).click();
  await page.getByRole("button", { name: "ส่งออเดอร์" }).click();
  await expect(page.getByText("ลบออกก่อนจึงจะส่งได้")).toBeVisible();
  await expect(page.getByText("หมด").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "ส่งออเดอร์" })).toBeDisabled();
});
