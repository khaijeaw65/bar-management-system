import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

async function enterMenu(page: Page, nickname?: string) {
  await page.goto("/scan/qr-t3");
  await expect(page.getByText("โต๊ะ T3")).toBeVisible();
  if (nickname) await page.getByRole("textbox", { name: "ชื่อเล่น" }).fill(nickname);
  await page.getByRole("button", { name: "ดูเมนู" }).click();
  await expect(page).toHaveURL(/\/customer\/menu$/);
}

async function addPlain(page: Page, name: string, note?: string) {
  await page.getByRole("button", { name: `เพิ่ม ${name}` }).click();
  const sheet = page.getByRole("dialog");
  if (note) await sheet.getByRole("textbox", { name: "หมายเหตุ (ไม่บังคับ)" }).fill(note);
  await sheet.getByRole("button", { name: /เพิ่มลงตะกร้า/ }).click();
  await expect(sheet).toBeHidden();
}

test("AC-1: scan, type a nickname, land on the menu, and a reload stays there", async ({ page }) => {
  await enterMenu(page, "ต้น");
  await expect(page.getByRole("heading", { name: "โต๊ะ T3" })).toBeVisible();
  await expect(page.getByText("· ต้น")).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/customer\/menu$/);
  await expect(page.getByRole("button", { name: "ดู ช้างดราฟต์" })).toBeVisible();
});

test("AC-2: an unknown QR shows the invalid-QR screen", async ({ page }) => {
  await page.goto("/scan/unknown-token");
  await expect(page.getByText("QR ไม่ถูกต้อง กรุณาติดต่อพนักงาน")).toBeVisible();
  await expect(page.getByRole("button", { name: "ลองอีกครั้ง" })).toHaveCount(0);
});

test("AC-3: J1 — half sheet, full sheet with a required option, one POST, cart cleared", async ({ page }) => {
  await enterMenu(page, "ต้น");
  await page.getByRole("button", { name: "เพิ่ม ช้างดราฟต์" }).click();
  const half = page.getByRole("dialog");
  await half.getByRole("button", { name: "เพิ่ม", exact: true }).click();
  await half.getByRole("button", { name: "เพิ่มลงตะกร้า · ฿240.00" }).click();

  await page.getByRole("button", { name: "เพิ่ม โอลด์แฟชั่น" }).click();
  const full = page.getByRole("dialog");
  await expect(full.getByRole("button", { name: /เพิ่มลงตะกร้า/ })).toBeDisabled();
  await full.getByText("น้ำแข็งน้อย").click();
  await full.getByRole("button", { name: /เพิ่มลงตะกร้า/ }).click();
  await addPlain(page, "ถั่วทอดสมุนไพร");

  await expect(page.getByText("ตะกร้า 4 รายการ")).toBeVisible();
  await page.getByRole("button", { name: "ดูตะกร้า" }).click();
  await expect(page).toHaveURL(/\/customer\/cart$/);
  await expect(page.getByText("สั่งในชื่อ ต้น")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(3);
  await expect(page.locator("span.text-title")).toHaveText("฿580.00");

  const sent = page.waitForRequest((request) => request.method() === "POST" && request.url().includes("/customer/orders"));
  await page.getByRole("button", { name: "สั่งเลย" }).click();
  expect((await sent).headers()["idempotency-key"]).toMatch(/[0-9a-f-]{36}/);
  await expect(page).toHaveURL(/\/customer\/tab$/);
  await expect(page.getByText("ส่งออเดอร์แล้ว · #001")).toBeVisible();
  await expect(page.getByText(/ตะกร้า \d+ รายการ/)).toHaveCount(0);
});

test("AC-4: J2 — a sold-out line is marked, removed, and the next send goes through", async ({ page }) => {
  await enterMenu(page);
  await addPlain(page, "ยำหมูยอ", "หมดทดสอบ");
  await addPlain(page, "ช้างดราฟต์");
  await page.getByRole("button", { name: "ดูตะกร้า" }).click();
  await page.getByRole("button", { name: "สั่งเลย" }).click();
  await expect(page.getByText("หมดแล้ว — ลบออกเพื่อสั่งต่อ")).toBeVisible();
  await expect(page.getByRole("button", { name: "สั่งเลย" })).toBeDisabled();

  await page.getByRole("button", { name: "ลบออก ยำหมูยอ" }).click();
  await expect(page.getByRole("button", { name: "สั่งเลย" })).toBeEnabled();
  await page.getByRole("button", { name: "สั่งเลย" }).click();
  await expect(page.getByText("ส่งออเดอร์แล้ว · #001")).toBeVisible();
});

test("AC-5: a dropped send is retried with the same Idempotency-Key", async ({ page }) => {
  await enterMenu(page);
  await addPlain(page, "ช้างดราฟต์", "ล่มทดสอบ");
  await page.getByRole("button", { name: "ดูตะกร้า" }).click();

  const keys: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/customer/orders")) {
      keys.push(request.headers()["idempotency-key"] ?? "");
    }
  });
  await page.getByRole("button", { name: "สั่งเลย" }).click();
  await expect(page.getByText("สั่งไม่สำเร็จ ลองอีกครั้ง")).toBeVisible();
  await page.getByRole("button", { name: "สั่งเลย" }).click();
  await expect(page.getByText("ส่งออเดอร์แล้ว · #001")).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
});

test("AC-6 + AC-7: 360 wide has no sideways scroll, and the cart survives a reload", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await enterMenu(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await addPlain(page, "ช้างดราฟต์");
  await page.reload();
  await expect(page.getByText("ตะกร้า 1 รายการ")).toBeVisible();
});

test("AC-7: blocked localStorage still gives a working in-memory cart", async ({ page }) => {
  await page.addInitScript(() => {
    // MSW keeps its own cookies in localStorage, so block only the cart key.
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (this: Storage, key: string) {
      if (key.startsWith("bar.customer.cart")) throw new Error("blocked");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
      if (key.startsWith("bar.customer.cart")) throw new Error("blocked");
      setItem.call(this, key, value);
    };
  });
  await enterMenu(page);
  await addPlain(page, "ช้างดราฟต์");
  await expect(page.getByText("ตะกร้า 1 รายการ")).toBeVisible();
});
