import { expect, test, type Page } from "@playwright/test";

// The page area, not the document: the POS top bar is not phone-ready yet (separate "phone 390 shell" brief).
const mainFits = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector("main");
    return main !== null && main.scrollWidth <= main.clientWidth && [...main.querySelectorAll("*")].every((node) => node.getBoundingClientRect().right <= main.getBoundingClientRect().right + 1);
  });

// HeroUI hides the native input under its label, so a switch is flipped by its label.
const flip = (page: Page, name: string) => page.locator("label").filter({ has: page.getByRole("switch", { name, exact: true }) }).click();

test("J1 (1280): policy 'รับเงิน' → group 'แคชเชียร์'", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/pos/settings/policies");
  await page.getByRole("button", { name: "สร้างนโยบาย" }).click();
  await page.getByRole("textbox", { name: "ชื่อนโยบาย" }).fill("รับเงิน");
  await flip(page, "ดูการชำระเงิน");
  await flip(page, "เปิดบิลชำระเงิน");
  await flip(page, "ยืนยันรับเงิน");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page.getByText("สร้างนโยบายแล้ว · มีผลทันที")).toBeVisible();
  await expect(page.getByRole("heading", { name: "รับเงิน" })).toBeVisible();

  await page.getByRole("link", { name: "กลุ่มสิทธิ์" }).click();
  await page.getByRole("button", { name: "สร้างกลุ่ม" }).click();
  const dialog = page.getByRole("dialog", { name: "สร้างกลุ่ม" });
  await dialog.getByRole("textbox", { name: "ชื่อกลุ่ม" }).fill("แคชเชียร์");
  await dialog.getByText("พนักงานหน้าร้าน", { exact: true }).click();
  await dialog.getByText("รับเงิน", { exact: true }).click();
  await dialog.getByRole("button", { name: "บันทึก" }).click();

  const row = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "แคชเชียร์" }) });
  await expect(row.getByText("พนักงานหน้าร้าน")).toBeVisible();
  await expect(row.getByText("รับเงิน")).toBeVisible();
  expect(await mainFits(page)).toBe(true);
});

test("J2 (390): matrix as cards with a reachable save bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pos/settings/policies");
  await page.getByRole("button", { name: "แก้ไข พนักงานหน้าร้าน" }).click();
  await flip(page, "ทั้งหมด การชำระเงิน");
  await expect(page.getByText("แก้ไข 1 รายการ")).toBeVisible();
  const save = page.getByRole("button", { name: "บันทึก" });
  await expect(save).toBeInViewport();
  expect(await mainFits(page)).toBe(true);
  await save.click();
  await expect(page.getByText("บันทึกแล้ว · มีผลทันที")).toBeVisible();
});

test("tabs for groups and policies are hidden from a manager without staff:manage", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pos-mock-role", "manager"));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/pos/settings");
  await expect(page.getByRole("heading", { name: "ตั้งค่าร้าน" }).or(page.getByRole("main")).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "กลุ่มสิทธิ์" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "นโยบายสิทธิ์ · ขั้นสูง" })).toHaveCount(0);
});
