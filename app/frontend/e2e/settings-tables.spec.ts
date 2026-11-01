import { expect, test } from "@playwright/test";

test.describe("Settings — Tables & Counter Seats Management (CD-13)", () => {
  test("J1: navigates to /pos/settings/tables and displays sections for tables and counter seats", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/settings/tables");

    await expect(page.getByRole("heading", { name: "โต๊ะและที่นั่ง", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "โต๊ะ", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "เคาน์เตอร์", level: 2 })).toBeVisible();

    // Verify presence of existing mock seats
    await expect(page.getByText("T3", { exact: true })).toBeVisible();
    await expect(page.getByText("C1", { exact: true })).toBeVisible();
  });

  test("J2: creates a new seat and rejects duplicate active label", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/settings/tables");

    await page.getByRole("button", { name: "เพิ่มที่นั่ง" }).click();
    const dialog = page.getByRole("dialog", { name: "เพิ่มที่นั่ง" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox", { name: "ชื่อโต๊ะ" }).fill("T7");
    await dialog.getByRole("radio", { name: "โต๊ะ" }).click();
    await dialog.getByRole("button", { name: "บันทึก" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("T7", { exact: true })).toBeVisible();

    // Duplicate check
    await page.getByRole("button", { name: "เพิ่มที่นั่ง" }).click();
    const dupDialog = page.getByRole("dialog", { name: "เพิ่มที่นั่ง" });
    await dupDialog.getByRole("textbox", { name: "ชื่อโต๊ะ" }).fill("T7");
    await dupDialog.getByRole("radio", { name: "โต๊ะ" }).click();
    await dupDialog.getByRole("button", { name: "บันทึก" }).click();

    await expect(dupDialog.getByText("มีชื่อนี้แล้ว")).toBeVisible();
    await dupDialog.getByRole("button", { name: "ยกเลิก" }).click();
  });

  test("J3: deactivating a seat with an active visit is blocked", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/settings/tables");

    // T3 has an active visit in seed mock data
    const rowT3 = page.getByRole("listitem").filter({ hasText: "T3" });
    await expect(rowT3.getByText("มีแขก")).toBeVisible();

    const switchT3 = rowT3.getByRole("switch");
    await switchT3.click();

    // Must show alert / toast indicating seat in use
    await expect(page.getByText(/มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน/)).toBeVisible();
  });

  test("J4: opens QR sticker print modal and previews high-contrast QR code", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/settings/tables");

    const rowT3 = page.getByRole("listitem").filter({ hasText: "T3" });
    await rowT3.getByRole("button", { name: "พิมพ์ QR" }).click();

    const modal = page.getByRole("dialog", { name: "QR โต๊ะ T3" });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("img", { name: "QR โต๊ะ T3" })).toBeVisible();
    await expect(modal.getByText("สแกนเพื่อสั่งอาหารและเครื่องดื่ม")).toBeVisible();
    await expect(modal.getByRole("button", { name: "พิมพ์" })).toBeVisible();

    // Test regenerate QR confirmation
    await modal.getByRole("button", { name: "สร้าง QR ใหม่" }).click();
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText(/QR เดิมจะใช้ไม่ได้ทันที/)).toBeVisible();
    await confirmDialog.getByRole("button", { name: "ยกเลิก" }).click();
    await expect(confirmDialog).toBeHidden();
  });
});
