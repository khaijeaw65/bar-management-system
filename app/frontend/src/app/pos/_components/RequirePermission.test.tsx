import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { apiEnvelope, posMockControls } from "@/mocks/handlers";
import { onlyPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/node";
import { RequirePermission } from "./RequirePermission";

const nav = vi.hoisted(() => ({ path: "/pos/reports", push: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.path,
  useRouter: () => ({ push: nav.push }),
}));

afterEach(() => {
  nav.path = "/pos/reports";
  nav.push.mockReset();
});

function renderGuard(child: ReactNode = <p>เนื้อหาหน้า</p>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<RequirePermission>{child}</RequirePermission>, {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}

test("พนักงาน typing /pos/reports gets the ไม่มีสิทธิ์ screen and the page never renders", async () => {
  posMockControls.setRole("staff");
  const reached = vi.fn();
  function Page() {
    reached();
    return <p>เนื้อหาหน้า</p>;
  }
  renderGuard(<Page />);
  expect(await screen.findByRole("alert")).toHaveTextContent("บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้");
  expect(reached).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: "กลับไปหน้าโต๊ะ" }));
  expect(nav.push).toHaveBeenCalledWith("/pos/tables");
});

test("พนักงาน cannot open the menu editor by URL either", async () => {
  posMockControls.setRole("staff");
  nav.path = "/pos/menu/new";
  renderGuard();
  expect(await screen.findByRole("alert")).toHaveTextContent("ไม่มีสิทธิ์");
  expect(screen.queryByText("เนื้อหาหน้า")).not.toBeInTheDocument();
});

test("without tables:read the way back is the first page that opens, and with nothing it says to ask the owner", async () => {
  server.use(onlyPermissions("reports:read"));
  nav.path = "/pos/menu";
  const first = renderGuard();
  await userEvent.click(await screen.findByRole("button", { name: "กลับไปหน้ารายงาน" }));
  expect(nav.push).toHaveBeenCalledWith("/pos/reports");
  first.unmount();

  server.use(onlyPermissions("venue:read"));
  nav.path = "/pos/reports";
  renderGuard();
  expect(await screen.findByText("ติดต่อเจ้าของร้าน")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("the owner sees the page; while the set loads nothing renders, not even the denial", async () => {
  renderGuard();
  expect(screen.getByLabelText("กำลังโหลดสิทธิ์")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(await screen.findByText("เนื้อหาหน้า")).toBeInTheDocument();
});

test("a failed permission load shows the retry pattern, and retry recovers", async () => {
  server.use(http.get("*/api/me/permissions", () => HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR"), { status: 500 }), { once: true }));
  renderGuard();
  expect(await screen.findByRole("alert")).toHaveTextContent("โหลดสิทธิ์ไม่สำเร็จ");
  await userEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  await waitFor(() => expect(screen.getByText("เนื้อหาหน้า")).toBeInTheDocument());
});

test("a path outside the map is never gated", async () => {
  nav.path = "/pos/anything-else";
  server.use(onlyPermissions());
  renderGuard();
  expect(await screen.findByText("เนื้อหาหน้า")).toBeInTheDocument();
});

test("AC-12 staff:manage alone opens /pos/settings/staff, and /pos/settings stays ไม่มีสิทธิ์", async () => {
  server.use(onlyPermissions("staff:manage", "tables:read"));
  nav.path = "/pos/settings/staff";
  const view = renderGuard();
  expect(await screen.findByText("เนื้อหาหน้า")).toBeInTheDocument();
  view.unmount();

  nav.path = "/pos/settings";
  renderGuard();
  expect(await screen.findByRole("alert")).toHaveTextContent("ไม่มีสิทธิ์");
});
