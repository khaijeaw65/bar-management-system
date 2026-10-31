import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { posMockControls } from "@/mocks/handlers";
import { onlyPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { VenueSettingsScreen } from "./VenueSettingsScreen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

afterEach(() => resetStaffSocket());

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<VenueSettingsScreen />, { wrapper: ({ children }: Readonly<{ children: ReactNode }>) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}

test("owner edits everything, including the PromptPay account", async () => {
  renderScreen();
  expect(await screen.findByRole("button", { name: "บันทึก" })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "เปลี่ยนบัญชี" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "ชื่อร้าน" })).not.toHaveAttribute("readonly");
});

test("ผู้จัดการ edits the venue but sees the payment section read-only", async () => {
  posMockControls.setRole("manager");
  renderScreen();
  expect(await screen.findByRole("button", { name: "บันทึก" })).toBeInTheDocument();
  expect(await screen.findByText("บัญชีพร้อมเพย์", { exact: false })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "เปลี่ยนบัญชี" })).not.toBeInTheDocument();
});

test("with venue:read only the form is read-only with no save and no payment section", async () => {
  server.use(onlyPermissions("venue:read"));
  renderScreen();
  expect(await screen.findByText("ดูได้อย่างเดียว — ไม่มีสิทธิ์แก้ไข")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "ชื่อร้าน" })).toHaveAttribute("readonly");
  expect(screen.getAllByRole("switch").every((item) => (item as HTMLInputElement).disabled)).toBe(true);
  expect(screen.queryByRole("button", { name: "บันทึก" })).not.toBeInTheDocument();
  expect(screen.queryByText("การชำระเงิน")).not.toBeInTheDocument();
});
