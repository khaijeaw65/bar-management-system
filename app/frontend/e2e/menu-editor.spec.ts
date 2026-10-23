import { expect, test } from "@playwright/test";

// Tall enough that the sticky footer never covers a field Playwright scrolls to the viewport edge.
test.use({ viewport: { width: 1280, height: 1000 } });

test("adds an item and sees it highlighted on the list", async ({ page }) => {
  await page.goto("/pos/menu");
  await page.getByRole("button", { name: "เพิ่มเมนูใหม่" }).click();
  await expect(page).toHaveURL(/\/pos\/menu\/new$/);

  await page.getByRole("textbox", { name: "ชื่อเมนู" }).fill("จินโทนิค");
  await page.getByRole("button", { name: /หมวด/ }).click();
  await page.getByRole("option", { name: "ค็อกเทล" }).click();
  await page.getByText("บาร์", { exact: true }).click();
  await page.getByRole("textbox", { name: "ราคา" }).fill("220");
  await page.getByRole("button", { name: "เพิ่มตัวเลือก" }).click();
  await page.getByRole("textbox", { name: "ชื่อตัวเลือก" }).nth(1).fill("ดับเบิล");
  await page.getByRole("textbox", { name: "ราคา" }).nth(1).fill("320");
  await page.getByRole("button", { name: "ระดับน้ำแข็ง" }).click();
  await page.getByRole("button", { name: "บันทึก" }).click();

  await expect(page).toHaveURL(/\/pos\/menu\?highlight=/);
  await expect(page.getByRole("rowheader", { name: "จินโทนิค" })).toBeVisible();
  await expect(page.getByText("เริ่ม ฿220.00")).toBeVisible();
});

test("a stale save shows the conflict and loads the latest copy", async ({ page }) => {
  await page.goto("/pos/menu");
  await page.getByRole("rowheader", { name: "สิงห์" }).click();
  const price = page.getByRole("textbox", { name: "ราคา" });
  await expect(price).toHaveValue("120.00");

  // Someone else saves first (same in-page mock server).
  await page.evaluate(async () => {
    const base = "http://localhost:3001/api/menu/items/11111111-1111-4111-8111-111111111111";
    const current = (await (await fetch(base)).json()).data;
    await fetch(base, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...current, updatedAt: new Date().toISOString(), variants: current.variants.map((v: object) => ({ ...v, price: "150.00" })), modifierGroupIds: [] }),
    });
  });

  await price.fill("130");
  await page.getByRole("button", { name: "บันทึก" }).click();
  await expect(page.getByText("เมนูนี้ถูกแก้โดยคนอื่น")).toBeVisible();
  await page.getByRole("button", { name: "โหลดฉบับล่าสุด" }).click();
  await expect(page.getByRole("textbox", { name: "ราคา" })).toHaveValue("150.00");
});
