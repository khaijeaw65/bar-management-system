import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 1000 } });

test("reorders categories with the arrow buttons and closes the manager", async ({ page }) => {
  await page.goto("/pos/menu");
  await expect(page.getByRole("rowheader", { name: "สิงห์" })).toBeVisible();
  await page.getByRole("button", { name: "จัดการหมวด" }).click();
  const dialog = page.getByRole("dialog", { name: "จัดการหมวด" });
  await expect(dialog.getByRole("button", { name: "ย้าย เบียร์ ขึ้น" })).toBeDisabled();

  await dialog.getByRole("button", { name: "ย้าย ค็อกเทล ขึ้น" }).click();
  await expect(dialog.getByRole("button", { name: /^แก้ชื่อ/ }).first()).toHaveText("ค็อกเทล");

  await dialog.getByRole("button", { name: "เสร็จ" }).click();
  await expect(dialog).toBeHidden();
});

test("creates an add-on group from the toolbar", async ({ page }) => {
  await page.goto("/pos/menu");
  // Data on screen = hydrated, so the click is not lost.
  await expect(page.getByRole("rowheader", { name: "สิงห์" })).toBeVisible();
  await page.getByRole("button", { name: "ตัวเลือกเสริม" }).click();
  await expect(page).toHaveURL(/\/pos\/menu\/modifiers$/);

  await page.getByRole("button", { name: "เพิ่มกลุ่ม" }).click();
  await page.getByRole("textbox", { name: "ชื่อกลุ่ม" }).fill("ท็อปปิ้ง");
  await page.getByRole("textbox", { name: "ชื่อตัวเลือก" }).fill("ชีส");
  await page.getByRole("textbox", { name: "ราคาเพิ่ม" }).fill("20");
  await page.getByRole("button", { name: "บันทึก" }).click();

  await expect(page.getByRole("button", { name: "แก้ไขกลุ่ม ท็อปปิ้ง" })).toBeVisible();
  await expect(page.getByText("ไม่บังคับ · สูงสุด 1")).toBeVisible();
});
