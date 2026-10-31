import { expect, test } from "@playwright/test";

// The page area, not the document: the POS top bar is not phone-ready yet (separate "phone 390 shell" brief).
const mainFits = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const main = document.querySelector("main");
    return main !== null && main.scrollWidth <= main.clientWidth && [...main.querySelectorAll("*")].every((node) => node.getBoundingClientRect().right <= main.getBoundingClientRect().right + 1);
  });

test("J1 (1280): approve ฝน as พนักงาน ถาวร in three taps", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/pos/settings/staff");
  await expect(page.getByRole("link", { name: "พนักงาน (2)" })).toBeVisible();

  const row = page.getByRole("listitem").filter({ hasText: "ฝน" }).filter({ has: page.getByRole("button", { name: "อนุมัติ" }) });
  await row.getByRole("button", { name: "อนุมัติ" }).click();
  const dialog = page.getByRole("dialog", { name: "อนุมัติคำขอ" });
  await expect(dialog.getByRole("textbox", { name: "ชื่อที่แสดง" })).toHaveValue("ฝน");
  await dialog.getByText("พนักงาน", { exact: true }).click();
  await dialog.getByRole("button", { name: "อนุมัติ" }).click();

  await expect(page.getByRole("link", { name: "ฝน" })).toBeVisible();
  await expect(page.getByRole("link", { name: "พนักงาน (1)" })).toBeVisible();
  expect(await mainFits(page)).toBe(true);
});

test("J1 at 1024: no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/pos/settings/staff");
  await expect(page.getByRole("heading", { name: "พนักงาน", level: 1 })).toBeVisible();
  expect(await mainFits(page)).toBe(true);
});

test("J2 (390): give เจ ผู้จัดการ until tonight's close from the phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pos/settings/staff");
  await page.getByRole("link", { name: "เจ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "สิทธิ์ที่มีตอนนี้" })).toBeVisible();

  await page.getByRole("button", { name: "เพิ่มกลุ่ม" }).click();
  const dialog = page.getByRole("dialog", { name: "เพิ่มกลุ่ม" });
  await dialog.getByText("ผู้จัดการ", { exact: true }).click();
  await dialog.getByText("ถึงสิ้นกะคืนนี้", { exact: true }).click();
  await dialog.getByRole("button", { name: "เพิ่มกลุ่ม" }).click();

  await expect(page.getByText(/^ผู้จัดการ · ถึง /)).toBeVisible();
  await expect(page.getByText("กลุ่ม ผู้จัดการ · นโยบาย จัดการร้าน").first()).toBeVisible();
  expect(await mainFits(page)).toBe(true);

  await page.getByRole("button", { name: "เมนูตั้งค่า" }).click();
  await expect(page.getByRole("dialog", { name: "เมนูตั้งค่า" }).getByRole("link", { name: "ร้าน" })).toBeVisible();
});
