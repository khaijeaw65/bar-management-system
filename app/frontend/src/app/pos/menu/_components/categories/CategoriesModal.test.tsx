import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "@heroui/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { server } from "@/mocks/node";
import { CategoriesModal } from "./CategoriesModal";

interface Sent {
  method: string;
  path: string;
  body: unknown;
}

const sent: Sent[] = [];

beforeEach(() => {
  server.events.on("request:start", async ({ request }) => {
    if (request.method === "GET") return;
    const text = await request.clone().text();
    sent.push({ method: request.method, path: new URL(request.url).pathname, body: text ? JSON.parse(text) : null });
  });
});

afterEach(() => {
  sent.length = 0;
  server.events.removeAllListeners();
});

function renderModal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Toast.Provider />
      <CategoriesModal onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

const names = () => screen.getAllByRole("button", { name: /^แก้ชื่อ/ }).map((button) => button.textContent);

test("moves a category with the arrow buttons and sends every id in the new order", async () => {
  const user = userEvent.setup();
  renderModal();
  await screen.findByRole("button", { name: "ย้าย ค็อกเทล ขึ้น" });
  expect(screen.getByRole("button", { name: "ย้าย เบียร์ ขึ้น" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "ย้าย อาหาร ลง" })).toBeDisabled();

  await user.click(screen.getByRole("button", { name: "ย้าย ค็อกเทล ขึ้น" }));

  await waitFor(() => expect(sent.find((call) => call.method === "PUT")).toBeDefined());
  const put = sent.find((call) => call.method === "PUT");
  expect(put?.path).toBe("/api/menu/categories/order");
  expect((put?.body as { ids: string[] }).ids).toHaveLength(3);
  await waitFor(() => expect(names().slice(0, 2)).toEqual(["ค็อกเทล", "เบียร์"]));
});

test("reverts the order and shows an error when the PUT fails", async () => {
  server.use(http.put("*/api/menu/categories/order", () => HttpResponse.json({ status: 500, code: "INTERNAL_ERROR", message: "x", data: null }, { status: 500 })));
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "ย้าย ค็อกเทล ขึ้น" }));
  expect(await screen.findByText("เรียงหมวดไม่สำเร็จ — ลองอีกครั้ง")).toBeInTheDocument();
  await waitFor(() => expect(names()).toEqual(["เบียร์", "ค็อกเทล", "อาหาร"]));
});

test("hides a category with its switch and shows the hidden note", async () => {
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("switch", { name: "แสดง อาหาร" }));
  await waitFor(() => expect(sent).toContainEqual({ method: "PATCH", path: expect.stringContaining("/api/menu/categories/"), body: { isActive: false } }));
  expect(await screen.findByText("ซ่อนจากเมนูลูกค้าและ POS")).toBeInTheDocument();
});

test("adds a category, rejects an empty or taken name, and renames one", async () => {
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "เพิ่มหมวด" }));
  await user.type(screen.getByRole("textbox", { name: "ชื่อหมวดใหม่" }), "{Enter}");
  expect(await screen.findByText("กรุณากรอกชื่อหมวด")).toBeInTheDocument();
  expect(sent).toHaveLength(0);

  await user.type(screen.getByRole("textbox", { name: "ชื่อหมวดใหม่" }), " เบียร์ {Enter}");
  expect(await screen.findByText("มีหมวดชื่อนี้แล้ว")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "ชื่อหมวดใหม่" })).toHaveValue(" เบียร์ ");

  await user.clear(screen.getByRole("textbox", { name: "ชื่อหมวดใหม่" }));
  await user.type(screen.getByRole("textbox", { name: "ชื่อหมวดใหม่" }), "ไวน์{Enter}");
  expect(await screen.findByRole("button", { name: "แก้ชื่อ ไวน์" })).toBeInTheDocument();
  expect(sent.filter((call) => call.method === "POST").at(-1)?.body).toEqual({ name: "ไวน์" });

  await user.click(screen.getByRole("button", { name: "แก้ชื่อ ไวน์" }));
  await user.clear(screen.getByRole("textbox", { name: "ชื่อหมวด ไวน์" }));
  await user.type(screen.getByRole("textbox", { name: "ชื่อหมวด ไวน์" }), "ไวน์แก้ว{Enter}");
  expect(await screen.findByRole("button", { name: "แก้ชื่อ ไวน์แก้ว" })).toBeInTheDocument();
  expect(sent.at(-1)?.body).toEqual({ name: "ไวน์แก้ว" });
});

test("blocks delete while the category holds items and deletes an empty one", async () => {
  const user = userEvent.setup();
  renderModal();
  await user.click(await screen.findByRole("button", { name: "เพิ่มหมวด" }));
  await user.type(screen.getByRole("textbox", { name: "ชื่อหมวดใหม่" }), "ว่าง{Enter}");
  await screen.findByRole("button", { name: "แก้ชื่อ ว่าง" });

  expect(screen.getByRole("button", { name: "ลบ ค็อกเทล" })).toBeDisabled();
  expect(screen.getByText("ลบไม่ได้ — ยังมี 2 เมนูในหมวดนี้")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "ลบ ว่าง" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "แก้ชื่อ ว่าง" })).not.toBeInTheDocument());
  expect(sent.some((call) => call.method === "DELETE")).toBe(true);
});
