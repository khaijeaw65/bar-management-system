import { expect, test } from "@playwright/test";

test("edits the name and cut-off, saves once, and guards unsaved changes", async ({ page }) => {
  const patches: unknown[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().endsWith("/api/venue/settings")) {
      patches.push(request.postDataJSON());
    }
  });

  await page.goto("/pos/settings");
  await expect(page.getByRole("heading", { name: "ตั้งค่าร้าน" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ตั้งค่า" })).toHaveAttribute("aria-current", "page");

  const name = page.getByRole("textbox", { name: "ชื่อร้าน" });
  await name.fill("The Loft 2");
  await page.getByRole("link", { name: "โต๊ะ" }).click();
  await expect(page.getByRole("dialog")).toContainText("ยังไม่ได้บันทึก");
  await page.getByRole("button", { name: "อยู่ต่อ" }).click();
  await expect(page).toHaveURL(/\/pos\/settings$/);

  await page.getByRole("spinbutton").first().click();
  await page.keyboard.type("05");
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(page.getByText("บันทึกแล้ว")).toBeVisible();
  expect(patches).toEqual([{ name: "The Loft 2", businessDayCutoff: "05:00" }]);

  await page.getByRole("link", { name: "โต๊ะ" }).click();
  await expect(page).toHaveURL(/\/pos\/tables$/);
});
