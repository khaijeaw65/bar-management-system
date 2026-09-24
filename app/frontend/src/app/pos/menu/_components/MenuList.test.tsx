import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { server } from "@/mocks/node";
import { MenuList } from "./MenuList";

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MenuList />
    </QueryClientProvider>,
  );
}

test("shows the loaded menu", async () => {
  renderList();
  expect(await screen.findByRole("rowheader", { name: "สิงห์" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "โมฮิโต้" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "ปีกไก่ทอด" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "วิสกี้ซาวร์" })).toBeInTheDocument();
  expect(screen.getByText("฿120.00")).toBeInTheDocument();
  expect(screen.getByText("หมด")).toBeInTheDocument();
});

test("shows the error state and retries", async () => {
  server.use(
    http.get(
      "*/api/menu/items",
      () => HttpResponse.json({ status: 500, message: "เกิดข้อผิดพลาด", data: null }, { status: 500 }),
      { once: true },
    ),
  );
  renderList();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(await screen.findByRole("rowheader", { name: "สิงห์" })).toBeInTheDocument();
});

test("shows the empty state", async () => {
  server.use(
    http.get("*/api/menu/items", () =>
      HttpResponse.json({ status: 200, message: "success", data: { items: [] } }),
    ),
  );
  renderList();
  expect(await screen.findByText("ยังไม่มีเมนู")).toBeInTheDocument();
});
