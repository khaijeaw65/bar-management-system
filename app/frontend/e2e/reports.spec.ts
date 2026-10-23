import { expect, test } from "@playwright/test";

test("overview: 30 วัน sample, then 7 วัน refetches with business dates", async ({ page }) => {
  const summaries: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith("/api/reports/summary")) summaries.push(url.search);
  });

  await page.goto("/pos/reports");
  await expect(page.getByRole("heading", { name: "รายงาน" })).toBeVisible();
  await expect(page.getByRole("link", { name: "รายงาน" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("฿440,660.00")).toBeVisible();
  await expect(page.getByText("฿734.43")).toBeVisible();
  await expect(page.getByRole("img", { name: "PromptPay 72% เงินสด 28%" })).toBeVisible();
  await expect(page.getByRole("img", { name: /ยอดขายรายวัน 30 วัน รวม ฿440,660.00/ })).toBeVisible();
  await expect(page.getByRole("list", { name: "ขายดี 5 อันดับ" }).getByRole("listitem")).toHaveCount(5);

  await page.getByRole("button", { name: /ช่วงเวลา/ }).click();
  await page.getByRole("option", { name: "7 วัน" }).click();
  await expect(page.getByRole("img", { name: /ยอดขายรายวัน 7 วัน/ })).toBeVisible();

  const [first, last] = [summaries.at(0) ?? "", summaries.at(-1) ?? ""].map((search) => new URLSearchParams(search));
  const days = (params: URLSearchParams) =>
    (Date.parse(params.get("to") ?? "") - Date.parse(params.get("from") ?? "")) / 86_400_000 + 1;
  expect(days(first)).toBe(30);
  expect(days(last)).toBe(7);
  expect(last.get("to")).toBe(first.get("to"));
});

test("today: tiles, open seats and live status; the tab is remembered", async ({ page }) => {
  await page.goto("/pos/reports");
  await page.getByRole("tab", { name: "วันนี้" }).click();

  await expect(page.getByText("฿18,420.00")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(/อัปเดต 21:14 น\. · สด/);
  await expect(page.getByRole("list", { name: "ที่นั่งที่เปิดอยู่" }).getByRole("listitem").first()).toContainText("T4");

  await page.reload();
  await expect(page.getByRole("tab", { name: "วันนี้" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: /มีปัญหา/ }).click();
  await expect(page).toHaveURL(/\/pos\/orders$/);
});
