import { expect, test } from "@playwright/test";

test("shows the menu heading and four rows", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/pos\/menu$/);
  await expect(page.getByRole("heading", { name: "เมนู" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
  await expect(page.getByRole("link", { name: "เมนู" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("rowheader")).toHaveCount(4);
});
