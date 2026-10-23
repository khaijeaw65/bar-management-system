import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 1000 } });

test("uploads a photo in the editor and sees the thumbnail on the list", async ({ page }) => {
  await page.goto("/pos/menu");
  await page.getByRole("rowheader", { name: "สิงห์" }).click();
  await page.getByLabel("เลือกไฟล์รูป").setInputFiles({
    name: "singha.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  });
  await expect(page.getByRole("img", { name: "รูปเมนู" })).toBeVisible();
  await page.getByRole("button", { name: "บันทึก" }).click();

  await expect(page).toHaveURL(/\/pos\/menu\?highlight=/);
  await expect(page.locator("tr", { hasText: "สิงห์" }).first().locator("img")).toBeVisible();
});
