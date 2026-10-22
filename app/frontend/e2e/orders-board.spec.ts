import { expect, test } from "@playwright/test";

test("accepts a new ticket and moves it to กำลังเตรียม", async ({ page }) => {
  await page.goto("/pos/orders");
  await page.getByRole("button", { name: "รับออเดอร์ #0041 T3" }).click();

  const preparing = page.getByRole("region", { name: "กำลังเตรียม" });
  await expect(preparing.getByRole("article", { name: "ออเดอร์ #0041 T3" })).toBeVisible();
  await expect(preparing.getByRole("button", { name: "เสิร์ฟแล้ว #0041 T3" })).toBeVisible();
});

test("resolves an escalated issue with ทำต่อ", async ({ page }) => {
  await page.goto("/pos/orders");
  await page.getByRole("button", { name: "จัดการปัญหา #0043 T2" }).click();

  const drawer = page.getByRole("complementary", { name: "#0043 · T2" });
  await expect(drawer.getByText("รายงานโดย นุ่น")).toBeVisible();
  await expect(drawer.getByRole("button", { name: "เปลี่ยนรายการ" })).toBeDisabled();
  await drawer.getByRole("button", { name: "ทำต่อ" }).click();

  await expect(page.getByText("ทำต่อ #0043 แล้ว")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "กำลังเตรียม" }).getByRole("article", { name: "ออเดอร์ #0043 T2" }),
  ).toBeVisible();
});
