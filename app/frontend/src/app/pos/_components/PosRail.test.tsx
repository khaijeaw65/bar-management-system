import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as rtlRender, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { PosRail } from "./PosRail";

vi.mock("next/navigation", () => ({
  usePathname: () => "/pos/menu",
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function render(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const labels = ["โต๊ะ", "ออเดอร์", "ชำระเงิน", "เมนู", "แขก", "รายงาน", "ตั้งค่า"];

test("renders the seven items in order", () => {
  render(<PosRail />);
  const nav = screen.getByRole("navigation", { name: "เมนูหลัก" });
  expect(Array.from(nav.children).map((item) => item.textContent)).toEqual(labels);
});

test("marks เมนู active and links โต๊ะ to the floor", () => {
  render(<PosRail />);
  const menu = screen.getByRole("link", { name: "เมนู" });
  expect(menu).toHaveAttribute("href", "/pos/menu");
  expect(menu).toHaveAttribute("aria-current", "page");

  const tables = screen.getByRole("link", { name: "โต๊ะ" });
  expect(tables).toHaveAttribute("href", "/pos/tables");
  expect(tables).not.toHaveAttribute("aria-current");
  expect(screen.getAllByRole("link")).toHaveLength(5);
  expect(screen.getByRole("link", { name: "ตั้งค่า" })).toHaveAttribute("href", "/pos/settings");
  expect(screen.getByRole("link", { name: "รายงาน" })).toHaveAttribute("href", "/pos/reports");

  const soon = screen.getAllByTitle("เร็ว ๆ นี้");
  expect(soon.map((item) => item.textContent)).toEqual(labels.filter((label) => !["เมนู", "โต๊ะ", "ออเดอร์", "รายงาน", "ตั้งค่า"].includes(label)));
  for (const item of soon) {
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item.tagName).toBe("SPAN");
  }
});

test("shows the pending ticket count on ออเดอร์", async () => {
  render(<PosRail />);
  expect(await screen.findByLabelText("รอรับ 1 ออเดอร์")).toHaveTextContent("1");
  expect(screen.getByRole("link", { name: /ออเดอร์/ })).toHaveAttribute("href", "/pos/orders");
});
