import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const out = new URL("../../../docs/handoffs/BRIEF-005/", import.meta.url);
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:3100/pos/menu");
await page.getByRole("heading", { name: "เมนู" }).waitFor();
await page.getByRole("rowheader", { name: "สิงห์" }).waitFor();
await page.screenshot({ path: new URL("menu-dark.png", out).pathname });

await page.getByRole("button", { name: "ธีมสว่าง" }).click();
await page.screenshot({ path: new URL("menu-light.png", out).pathname });
await page.reload();
await page.getByRole("heading", { name: "เมนู" }).waitFor();
const lightPressed = await page.getByRole("button", { name: "ธีมสว่าง" }).getAttribute("aria-pressed");
console.log("light pressed after reload:", lightPressed);
await page.screenshot({ path: new URL("menu-light-reload.png", out).pathname });

const blocked = await browser.newContext({
  serviceWorkers: "block",
  viewport: { width: 1280, height: 800 },
});

const errorPage = await blocked.newPage();
await errorPage.route("**/api/menu/items", (route) =>
  route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ status: 500, message: "เกิดข้อผิดพลาด", data: null }),
  }),
);
await errorPage.goto("http://localhost:3100/pos/menu");
await errorPage.getByRole("button", { name: "ลองอีกครั้ง" }).waitFor();
await errorPage.screenshot({ path: new URL("menu-error.png", out).pathname });

const emptyPage = await blocked.newPage();
await emptyPage.route("**/api/menu/items", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: 200, message: "success", data: { items: [] } }),
  }),
);
await emptyPage.goto("http://localhost:3100/pos/menu");
await emptyPage.getByText("ยังไม่มีเมนู").waitFor();
await emptyPage.screenshot({ path: new URL("menu-empty.png", out).pathname });

await browser.close();
console.log("screenshots written");
