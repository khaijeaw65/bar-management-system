import { expect, test } from "@playwright/test";

test("LINE login shows the pending label and leaves for the API", async ({ page }) => {
  // The page leaves 250 ms after the click, and Playwright's own queries stall once that navigation starts.
  // So the label is watched from inside the page and reported out, instead of polled from the test.
  let sawPending = false;
  await page.exposeFunction("reportPending", () => {
    sawPending = true;
  });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes("กำลังเปลี่ยนเส้นทาง..."));
      if (button?.hasAttribute("disabled")) (window as unknown as { reportPending: () => void }).reportPending();
    }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true });
  });
  await page.route("**/auth/line/login", (route) => route.fulfill({ status: 200, body: "line" }));
  await page.goto("/login");
  await page.getByRole("button", { name: "เข้าสู่ระบบด้วย LINE" }).click({ noWaitAfter: true });
  await page.waitForURL(/\/auth\/line\/login$/);
  expect(sawPending).toBe(true);
});

test("login errors render without calling the API", async ({ page }) => {
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) apiCalls.push(request.url());
  });

  await page.goto("/login?error=login_failed");
  const alert = page.getByRole("alert").filter({ hasText: "เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง" });
  await expect(alert).toBeVisible();
  await page.getByRole("button", { name: "ปิด" }).click();
  await expect(alert).toHaveCount(0);

  await page.goto("/login?error=not_registered");
  await expect(page.getByRole("heading", { name: "บัญชีนี้ยังไม่ได้ลงทะเบียน" })).toBeVisible();
  await expect(page.getByRole("link", { name: "กลับไปหน้าเข้าสู่ระบบ" })).toBeVisible();
  expect(apiCalls).toEqual([]);
});
