import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { PosRail } from "./PosRail";

vi.mock("next/navigation", () => ({
  usePathname: () => "/pos/menu",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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
  expect(screen.getAllByRole("link")).toHaveLength(2);

  const soon = screen.getAllByTitle("เร็ว ๆ นี้");
  expect(soon.map((item) => item.textContent)).toEqual(labels.filter((label) => label !== "เมนู" && label !== "โต๊ะ"));
  for (const item of soon) {
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item.tagName).toBe("SPAN");
  }
});
