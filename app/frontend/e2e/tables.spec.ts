import { expect, test } from "@playwright/test";
import { attachedVisitId } from "../src/mocks/handlers";

test("the POS home is the table grid", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/pos\/tables$/);
  await expect(page.getByRole("heading", { name: "โต๊ะ", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "โต๊ะ" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("ใช้งาน 3")).toBeVisible();
});

test("opens a free table for a guest", async ({ page }) => {
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: "T6" }).click();
  const dialog = page.getByRole("dialog", { name: "เปิดโต๊ะ" });
  await dialog.getByRole("textbox", { name: "ชื่อแขก (ไม่บังคับ)" }).fill("แพร");
  await dialog.getByRole("button", { name: "เปิดโต๊ะ" }).click();
  await expect(page.getByText("เปิด T6 แล้ว")).toBeVisible();
  await expect(page.getByText("แขก แพร")).toBeVisible();
  await expect(page.getByRole("button", { name: /T6/ })).toContainText("เปิดแล้ว");
  await expect(page.getByRole("button", { name: /T6/ })).toContainText("แพร");
});

test("closes an empty table from the drawer", async ({ page }) => {
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: "T6" }).click();
  const open = page.getByRole("dialog", { name: "เปิดโต๊ะ" });
  await open.getByRole("textbox", { name: "ชื่อแขก (ไม่บังคับ)" }).fill("แพร");
  await open.getByRole("button", { name: "เปิดโต๊ะ" }).click();
  await expect(page.getByText("เปิด T6 แล้ว")).toBeVisible();
  await page.getByRole("button", { name: /T6/ }).click();
  const drawer = page.getByRole("dialog", { name: "โต๊ะ T6" });
  await expect(drawer.getByText("ยังไม่มีออเดอร์")).toBeVisible();
  await drawer.getByRole("button", { name: "ปิดโต๊ะ" }).click();
  const confirm = page.getByRole("dialog", { name: "ปิดโต๊ะ T6?" });
  await confirm.getByRole("button", { name: "ปิดโต๊ะ" }).click();
  await expect(page.getByText("ปิดโต๊ะ T6 แล้ว")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "โต๊ะ T6" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "T6" })).not.toContainText("เปิดแล้ว");
});

test("asks before joining a table a guest already opened", async ({ page }) => {
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: "T5" }).click();
  await page.getByRole("dialog", { name: "เปิดโต๊ะ" }).getByRole("button", { name: "เปิดโต๊ะ" }).click();
  await expect(page.getByRole("heading", { name: "T5 เพิ่งถูกเปิดไปแล้ว" })).toBeVisible();
  const asked = page.getByRole("dialog", { name: "T5 เพิ่งถูกเปิดไปแล้ว" });
  await expect(asked.getByText("ลูกค้า (สแกน QR)")).toBeVisible();
  await expect(asked.getByText("21:12 น.")).toBeVisible();
  await expect(asked.locator("dd", { hasText: "ฝน" })).toBeVisible();
  await page.getByRole("button", { name: "เข้าโต๊ะเดิม (ฝน)" }).click();
  await expect(page).toHaveURL(new RegExp(`visit=${attachedVisitId}`));
  await expect(page.getByRole("button", { name: /T5/ })).toHaveAttribute("aria-pressed", "true");
});
