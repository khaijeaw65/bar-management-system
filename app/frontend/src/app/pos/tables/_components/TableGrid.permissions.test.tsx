import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { onlyPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { TableGrid } from "./TableGrid";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/pos/tables",
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

afterEach(() => {
  replace.mockReset();
  resetStaffSocket();
});

function renderGrid() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<TableGrid />, { wrapper: ({ children }: Readonly<{ children: ReactNode }>) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}

test("with visits:open the header has + เปิดโต๊ะ and a free seat opens the dialog", async () => {
  renderGrid();
  expect(await screen.findByRole("button", { name: "+ เปิดโต๊ะ" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "C1" }));
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
});

test("without visits:open there is no + เปิดโต๊ะ and tapping a free seat does nothing", async () => {
  server.use(onlyPermissions("tables:read"));
  renderGrid();
  await screen.findByRole("button", { name: "C1" });
  expect(screen.queryByRole("button", { name: "+ เปิดโต๊ะ" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "C1" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("while the permission set loads, + เปิดโต๊ะ is not rendered at all", () => {
  renderGrid();
  expect(screen.queryByRole("button", { name: "+ เปิดโต๊ะ" })).not.toBeInTheDocument();
});
