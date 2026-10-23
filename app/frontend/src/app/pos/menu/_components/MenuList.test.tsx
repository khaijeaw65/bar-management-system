import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast, toast } from "@heroui/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { apiEnvelope, menuCategories, menuItems } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { MenuList } from "./MenuList";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

afterEach(() => {
  toast.clear();
  resetStaffSocket();
  push.mockReset();
});

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        {children}
      </QueryClientProvider>
    );
  }
  return render(<MenuList />, { wrapper: Wrap });
}

test("shows the loaded menu", async () => {
  renderList();
  expect(await screen.findByRole("rowheader", { name: "สิงห์" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "โมฮิโต้" })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: /ปีกไก่ทอด/ })).toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "วิสกี้ซาวร์" })).toBeInTheDocument();
  expect(screen.getByText("฿120.00")).toBeInTheDocument();
  expect(screen.getByText("เริ่ม ฿180.00")).toBeInTheDocument();
  expect(screen.getByText("นอกเวลาโปร")).toBeInTheDocument();
  expect(screen.getByText("หมด")).toBeInTheDocument();
});

test("shows the error state and retries", async () => {
  server.use(
    http.get(
      "*/api/menu/items",
      () =>
        HttpResponse.json(
          { status: 500, code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาด", data: null },
          { status: 500 },
        ),
      { once: true },
    ),
  );
  renderList();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(await screen.findByRole("rowheader", { name: "สิงห์" })).toBeInTheDocument();
});

test("shows the empty state with the add button", async () => {
  server.use(http.get("*/api/menu/items", () => HttpResponse.json(apiEnvelope({ items: [] }))));
  renderList();
  expect(await screen.findByText("ยังไม่มีเมนู")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "เพิ่มเมนูแรก" }));
  expect(push).toHaveBeenCalledWith("/pos/menu/new");
});

test("search and category chips filter together", async () => {
  renderList();
  await screen.findByRole("rowheader", { name: "สิงห์" });
  await userEvent.click(screen.getByRole("button", { name: "ค็อกเทล" }));
  expect(screen.queryByRole("rowheader", { name: "สิงห์" })).not.toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "โมฮิโต้" })).toBeInTheDocument();
  await userEvent.type(screen.getByRole("searchbox", { name: "ค้นหาเมนู" }), "  ซาวร์ ");
  expect(screen.queryByRole("rowheader", { name: "โมฮิโต้" })).not.toBeInTheDocument();
  expect(screen.getByRole("rowheader", { name: "วิสกี้ซาวร์" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "เบียร์" }));
  expect(await screen.findByText("ไม่พบเมนูที่ค้นหา")).toBeInTheDocument();
});

test("marks items of a hidden category", async () => {
  server.use(
    http.get("*/api/menu/categories", () =>
      HttpResponse.json(
        apiEnvelope({ items: menuCategories.map((c) => (c.name === "เบียร์" ? { ...c, isActive: false } : c)) }),
      ),
    ),
  );
  renderList();
  await screen.findByRole("rowheader", { name: "สิงห์" });
  expect(screen.getAllByText("ซ่อนอยู่")).toHaveLength(1);
});

test("a row tap opens the editor, the switch toggles without opening it", async () => {
  const requests: string[] = [];
  server.events.on("request:start", ({ request }) => requests.push(`${request.method} ${new URL(request.url).pathname}`));
  renderList();
  await userEvent.click(await screen.findByRole("rowheader", { name: "สิงห์" }));
  expect(push).toHaveBeenCalledWith(`/pos/menu/${menuItems[0]?.id}`);
  push.mockReset();

  // The visible control, as a finger or mouse hits it — not the hidden input.
  const control = screen.getByRole("switch", { name: "พร้อมขาย สิงห์" }).closest('[data-slot="switch"]')?.querySelector('[data-slot="switch-control"]');
  await userEvent.click(control!);
  expect(await screen.findByText("สิงห์ หมดแล้ว")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  expect(requests).toContain(`POST /api/menu/items/${menuItems[0]?.id}/mark-unavailable`);
  server.events.removeAllListeners();
});

test("a failed toggle reverts the switch and says so", async () => {
  server.use(
    http.post("*/api/menu/items/:id/mark-unavailable", () =>
      HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR", "พัง"), { status: 500 }),
    ),
  );
  renderList();
  const toggle = await screen.findByRole("switch", { name: "พร้อมขาย สิงห์" });
  await userEvent.click(toggle);
  expect(await screen.findByText("เปลี่ยนสถานะไม่สำเร็จ")).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("switch", { name: "พร้อมขาย สิงห์" })).toBeChecked());
});
