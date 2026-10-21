import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { LoginScreen } from "./_components/LoginScreen";

const nav = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

const assign = vi.fn();

test("LINE button shows the pending label and leaves for the API login", async () => {
  nav.search = "";
  assign.mockReset();
  vi.stubGlobal("location", { assign });
  render(<LoginScreen />);

  await userEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบด้วย LINE" }));
  expect(screen.getByRole("button", { name: "กำลังเปลี่ยนเส้นทาง..." })).toBeDisabled();
  await vi.waitFor(() =>
    expect(assign).toHaveBeenCalledWith("http://localhost:3001/api/auth/line/login"),
  );
});

test("login_failed is a dismissible alert and calls no API", async () => {
  nav.search = "error=login_failed";
  const seen: string[] = [];
  const { server } = await import("@/mocks/node");
  server.events.on("request:start", ({ request }) => seen.push(request.url));
  render(<LoginScreen />);

  expect(screen.getByRole("alert")).toHaveTextContent("เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง");
  await userEvent.click(screen.getByRole("button", { name: "ปิด" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(seen.filter((url) => url.includes("/api/"))).toEqual([]);
  server.events.removeAllListeners();
});

test("not_registered shows the card and no API call", async () => {
  nav.search = "error=not_registered";
  const seen: string[] = [];
  const { server } = await import("@/mocks/node");
  server.events.on("request:start", ({ request }) => seen.push(request.url));
  render(<LoginScreen />);

  expect(screen.getByRole("heading", { name: "บัญชีนี้ยังไม่ได้ลงทะเบียน" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "กลับไปหน้าเข้าสู่ระบบ" })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("button", { name: "เข้าสู่ระบบด้วย LINE" })).not.toBeInTheDocument();
  expect(seen.filter((url) => url.includes("/api/"))).toEqual([]);
  server.events.removeAllListeners();
});
