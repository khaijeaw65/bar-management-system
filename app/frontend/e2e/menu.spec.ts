import { expect, test } from "@playwright/test";

test("shows the menu heading and four rows", async ({ page }) => {
  await page.goto("/pos/menu");
  await expect(page).toHaveURL(/\/pos\/menu$/);
  await expect(page.getByRole("heading", { name: "เมนู" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
  await expect(page.getByRole("link", { name: "เมนู" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("rowheader")).toHaveCount(4);
});

test("the sold-out switch toggles on the list and does not open the editor", async ({ page }) => {
  await page.goto("/pos/menu");
  // The visible control, not the hidden input.
  const sold = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "สิงห์" }) }).locator('[data-slot="switch-control"]');
  await sold.click();
  await expect(page.getByText("สิงห์ หมดแล้ว")).toBeVisible();
  await expect(page).toHaveURL(/\/pos\/menu$/);

  await page.getByRole("rowheader", { name: "สิงห์" }).click();
  await expect(page).toHaveURL(/\/pos\/menu\/[0-9a-f-]{36}$/);
});
