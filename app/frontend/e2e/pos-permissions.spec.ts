import { expect, test, type Page } from "@playwright/test";

// The mock role lives in sessionStorage (mocks/permissions.ts), so it survives opening a page by URL.
async function asRole(page: Page, role: "manager" | "staff") {
  await page.addInitScript((value) => sessionStorage.setItem("pos-mock-role", value), role);
}

test("พนักงาน: no รายงาน in the rail, no coming-soon items, no add-menu button, sold-out switch kept", async ({ page }) => {
  await asRole(page, "staff");
  await page.goto("/pos/menu");
  const rail = page.getByRole("navigation", { name: "เมนูหลัก" });
  await expect(rail.getByRole("link", { name: "เมนู" })).toBeVisible();
  await expect(rail.getByRole("link", { name: "โต๊ะ" })).toBeVisible();
  await expect(rail.getByRole("link", { name: /ออเดอร์/ })).toBeVisible();
  await expect(rail.getByRole("link", { name: "รายงาน" })).toHaveCount(0);
  await expect(rail.getByRole("link", { name: "ตั้งค่า" })).toHaveCount(0);
  await expect(rail.getByRole("link")).toHaveCount(3);
  await expect(rail.getByTitle("เร็ว ๆ นี้")).toHaveCount(0);

  await expect(page.getByRole("rowheader", { name: "สิงห์" })).toBeVisible();
  await expect(page.getByRole("button", { name: /เพิ่มเมนูใหม่/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "จัดการหมวด" })).toHaveCount(0);
  await expect(page.getByRole("switch").first()).toBeVisible();
});

test("พนักงาน: checkout offers the QR and slip scan but no manual confirm, with a hint for the manager", async ({ page }) => {
  await asRole(page, "staff");
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: /T3/ }).click();
  await page.getByRole("complementary", { name: "โต๊ะ T3" }).getByRole("button", { name: "ชำระเงิน" }).click();
  const checkout = page.getByRole("dialog").last();
  await checkout.getByRole("button", { name: "สร้าง QR" }).click();
  await expect(checkout.getByText(/หมดเวลาใน/)).toBeVisible();
  await expect(checkout.getByRole("button", { name: "สแกนสลิป" })).toBeVisible();
  await expect(checkout.getByRole("button", { name: "ยืนยันด้วยตนเอง" })).toHaveCount(0);
  await expect(checkout.getByText("ให้ผู้จัดการยืนยันรับเงิน")).toBeVisible();
});

test("พนักงาน typing a back-office URL gets ไม่มีสิทธิ์, and the way back works", async ({ page }) => {
  await asRole(page, "staff");
  const calls: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/reports\//.test(request.url())) calls.push(request.url());
  });
  await page.goto("/pos/reports");
  await expect(page.getByText("บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้")).toBeVisible();
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: "กลับไปหน้าโต๊ะ" }).click();
  await expect(page).toHaveURL(/\/pos\/tables$/);

  await page.goto("/pos/menu/new");
  await expect(page.getByText("บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้")).toBeVisible();
  await page.goto("/pos/settings");
  await expect(page.getByText("บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้")).toBeVisible();
});

test("ผู้จัดการ: reports open, and the settings payment section is read-only", async ({ page }) => {
  await asRole(page, "manager");
  await page.goto("/pos/reports");
  await expect(page.getByRole("heading", { name: "รายงาน" })).toBeVisible();
  await page.goto("/pos/settings");
  await expect(page.getByRole("button", { name: "บันทึก", exact: true })).toBeVisible();
  await expect(page.getByText("บัญชีพร้อมเพย์", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "เปลี่ยนบัญชี" })).toHaveCount(0);
});

test("owner keeps everything", async ({ page }) => {
  await page.goto("/pos/settings");
  await expect(page.getByRole("button", { name: "เปลี่ยนบัญชี" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link")).toHaveCount(5);
});

test("a 403 with missing codes toasts and the button disappears after the refetch", async ({ page }) => {
  await asRole(page, "manager");
  await page.goto("/pos/tables");
  await page.getByRole("button", { name: /T3/ }).click();
  await page.getByRole("complementary", { name: "โต๊ะ T3" }).getByRole("button", { name: "ชำระเงิน" }).click();
  const checkout = page.getByRole("dialog").last();
  await checkout.getByRole("button", { name: "สร้าง QR" }).click();
  await checkout.getByRole("button", { name: "ยืนยันด้วยตนเอง" }).click();
  await checkout.getByRole("button", { name: /เหตุผล|เลือก/ }).click();
  await page.getByRole("option", { name: "ลูกค้าโอนเข้าบัญชีร้านโดยตรง" }).click();
  // The role changes mid-shift: the next permission answer no longer holds payments:mark_paid.
  await page.evaluate(() => (window as unknown as { __posMock: { setRole: (role: string) => void } }).__posMock.setRole("staff"));
  await checkout.getByRole("button", { name: "ยืนยันว่าชำระแล้ว" }).click();
  await expect(page.getByText("ไม่มีสิทธิ์ทำรายการนี้")).toBeVisible();
  // The refetch ran: the manual-confirm path is gone from the rail-level permission set too.
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "รายงาน" })).toHaveCount(0);
});
