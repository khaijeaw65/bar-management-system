import { expect, test, type Page } from "@playwright/test";

async function asRole(page: Page, role: "owner" | "manager" | "staff") {
  await page.addInitScript((value) => sessionStorage.setItem("pos-mock-role", value), role);
}

test.describe("POS — Void / Comp Order Item (CD-02, DEF-07)", () => {
  test("J1: staff voids an item with manager PIN, correcting the bill", async ({ page }) => {
    await asRole(page, "staff");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/tables");

    // Open drawer for Table T3 (has active orders)
    await page.getByRole("button", { name: /T3/ }).click();
    const drawer = page.getByRole("complementary", { name: "โต๊ะ T3" });
    await expect(drawer).toBeVisible();

    // Select an active item line and trigger adjustment
    const itemRow = drawer.getByRole("listitem").filter({ hasText: "สิงห์" });
    await expect(itemRow).toBeVisible();
    await itemRow.getByRole("button", { name: /ยกเลิก \/ Comp|ปรับยอด/ }).click();

    // Verify modal elements
    const modal = page.getByRole("dialog", { name: /ยกเลิกรายการ \/ Comp/ });
    await expect(modal).toBeVisible();
    await expect(modal.getByText("สิงห์")).toBeVisible();

    // Select void + reason "ของหมด"
    await modal.getByRole("radio", { name: "ยกเลิก" }).click();
    await modal.getByRole("button", { name: /เหตุผล/ }).click();
    await page.getByRole("option", { name: "ของหมด" }).click();

    // Enter 4-digit manager PIN
    for (const digit of ["1", "2", "3", "4"]) {
      await modal.getByRole("button", { name: digit, exact: true }).click();
    }

    await modal.getByRole("button", { name: "ยืนยันการยกเลิก" }).click();
    await expect(modal).toBeHidden();

    // Verify toast & cancelled state
    await expect(page.getByText(/ยกเลิก.*แล้ว/)).toBeVisible();
    await expect(itemRow.getByText("ยกเลิก")).toBeVisible();
  });

  test("J2: staff comps an item with manager PIN", async ({ page }) => {
    await asRole(page, "staff");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/tables");

    await page.getByRole("button", { name: /T3/ }).click();
    const drawer = page.getByRole("complementary", { name: "โต๊ะ T3" });

    const itemRow = drawer.getByRole("listitem").filter({ hasText: "โมฮิโต้" });
    await itemRow.getByRole("button", { name: /ยกเลิก \/ Comp|ปรับยอด/ }).click();

    const modal = page.getByRole("dialog", { name: /ยกเลิกรายการ \/ Comp/ });
    await modal.getByRole("radio", { name: /Comp/ }).click();
    await modal.getByRole("button", { name: /เหตุผล/ }).click();
    await page.getByRole("option", { name: "บริการพิเศษ" }).click();

    for (const digit of ["1", "2", "3", "4"]) {
      await modal.getByRole("button", { name: digit, exact: true }).click();
    }

    await modal.getByRole("button", { name: "ยืนยัน Comp" }).click();
    await expect(modal).toBeHidden();

    await expect(page.getByText(/Comp.*แล้ว/)).toBeVisible();
    await expect(itemRow.getByText("Comp")).toBeVisible();
    await expect(itemRow.getByText("฿0.00")).toBeVisible();
  });

  test("J3: wrong manager PIN displays error and rejects action", async ({ page }) => {
    await asRole(page, "staff");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/tables");

    await page.getByRole("button", { name: /T3/ }).click();
    const drawer = page.getByRole("complementary", { name: "โต๊ะ T3" });

    const itemRow = drawer.getByRole("listitem").filter({ hasText: "สิงห์" });
    await itemRow.getByRole("button", { name: /ยกเลิก \/ Comp|ปรับยอด/ }).click();

    const modal = page.getByRole("dialog", { name: /ยกเลิกรายการ \/ Comp/ });
    await modal.getByRole("radio", { name: "ยกเลิก" }).click();
    await modal.getByRole("button", { name: /เหตุผล/ }).click();
    await page.getByRole("option", { name: "สั่งผิด" }).click();

    // Enter wrong PIN "9999"
    for (let i = 0; i < 4; i++) {
      await modal.getByRole("button", { name: "9", exact: true }).click();
    }

    await modal.getByRole("button", { name: "ยืนยันการยกเลิก" }).click();
    await expect(modal.getByText("PIN ไม่ถูกต้อง")).toBeVisible();
    await expect(modal).toBeVisible();
  });

  test("J4: manager logged in sees self-approval notice", async ({ page }) => {
    await asRole(page, "owner");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/pos/tables");

    await page.getByRole("button", { name: /T3/ }).click();
    const drawer = page.getByRole("complementary", { name: "โต๊ะ T3" });

    const itemRow = drawer.getByRole("listitem").filter({ hasText: "สิงห์" });
    await itemRow.getByRole("button", { name: /ยกเลิก \/ Comp|ปรับยอด/ }).click();

    const modal = page.getByRole("dialog", { name: /ยกเลิกรายการ \/ Comp/ });
    await expect(modal.getByText(/อนุมัติด้วยตนเอง/)).toBeVisible();
  });
});
