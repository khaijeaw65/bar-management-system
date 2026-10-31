import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { posMockControls } from "@/mocks/handlers";
import { onlyPermissions } from "@/mocks/permissions";
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
  push.mockReset();
  resetStaffSocket();
});

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MenuList />, { wrapper: ({ children }: Readonly<{ children: ReactNode }>) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}

test("owner: add, categories, add-ons and the sold-out switch are all there", async () => {
  renderList();
  expect(await screen.findByRole("button", { name: /เพิ่มเมนูใหม่/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "จัดการหมวด" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ตัวเลือกเสริม" })).toBeInTheDocument();
  expect(screen.getAllByRole("switch").length).toBeGreaterThan(0);
});

test("พนักงาน: the list and the sold-out switch, but no add / edit / manage, and a row tap opens nothing", async () => {
  posMockControls.setRole("staff");
  renderList();
  const row = await screen.findByRole("rowheader", { name: "สิงห์" });
  expect(screen.queryByRole("button", { name: /เพิ่มเมนูใหม่/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "จัดการหมวด" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ตัวเลือกเสริม" })).not.toBeInTheDocument();
  expect(screen.getAllByRole("switch").length).toBeGreaterThan(0);
  await userEvent.click(row);
  expect(push).not.toHaveBeenCalled();
});

test("without menu:toggle_availability the switch is gone but the status chip stays", async () => {
  server.use(onlyPermissions("menu:read"));
  renderList();
  await screen.findByRole("rowheader", { name: "สิงห์" });
  expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  expect(screen.getAllByText("พร้อมขาย").length).toBeGreaterThan(0);
});
