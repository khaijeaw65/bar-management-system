import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { formatThaiTime } from "../../tables/_components/table-time";
import { orderLine, ticket } from "../../tables/_components/session.fixture";
import { TicketDrawer } from "./TicketDrawer";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }) }));

const staff = { staffId: "11111111-1111-4111-8111-111111111111", displayName: "นุ่น" };
const lineId = "70000000-0000-4000-8000-000000000301";
const escalatedAt = "2026-10-21T12:10:00.000Z";

function issueTicket() {
  return ticket("60000000-0000-4000-8000-000000000301", 45, [orderLine(lineId, "สิงห์")], {
    status: "issue",
    seat: { id: "10000000-0000-4000-8000-000000000003", label: "T3", kind: "table" },
    issue: { reason: "out_of_stock", itemId: lineId, note: "เหลือขวดสุดท้ายแตก", reportedBy: staff, escalatedAt },
  });
}

function renderDrawer(onResolve = vi.fn(), onClose = vi.fn(), canAct = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  render(<TicketDrawer ticket={issueTicket()} kitchenOn={false} canAct={canAct} resolving={false} onResolve={onResolve} onClose={onClose} />, {
    wrapper: Wrap,
  });
  return { onResolve, onClose };
}

test("shows the escalated issue and keeps void and replace unavailable", () => {
  renderDrawer();
  const drawer = screen.getByRole("complementary", { name: "#0045 · T3" });
  expect(drawer).toHaveTextContent("ของหมด");
  expect(drawer).toHaveTextContent("รายการ: สิงห์");
  expect(drawer).toHaveTextContent("เหลือขวดสุดท้ายแตก");
  expect(drawer).toHaveTextContent(`รายงานโดย นุ่น · ส่งมาจากแอปพนักงาน ${formatThaiTime(escalatedAt)}`);
  expect(screen.getByRole("button", { name: "ยกเลิกรายการที่มีปัญหา" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "เปลี่ยนรายการ" })).toBeDisabled();
  expect(screen.getByText("ต้องใช้สิทธิ์ผู้จัดการ — รอระบบยกเลิกรายการ")).toBeInTheDocument();
});

test("ทำต่อ resolves the ticket", async () => {
  const { onResolve } = renderDrawer();
  await userEvent.setup().click(screen.getByRole("button", { name: "ทำต่อ" }));
  expect(onResolve).toHaveBeenCalledTimes(1);
});

test("links to the seat's current visit from the floor query", async () => {
  renderDrawer();
  const link = screen.getByRole("button", { name: "ไปที่โต๊ะ T3" });
  await vi.waitFor(() => expect(link).toBeEnabled());
  await userEvent.setup().click(link);
  expect(nav.push).toHaveBeenCalledWith(`/pos/tables?visit=20000000-0000-4000-8000-000000000003`);
});

test("a person who cannot act sees the issue but no resolve or void buttons", () => {
  renderDrawer(vi.fn(), vi.fn(), false);
  const drawer = screen.getByRole("complementary", { name: "#0045 · T3" });
  expect(drawer).toHaveTextContent("ของหมด");
  expect(screen.queryByRole("button", { name: "ทำต่อ" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ยกเลิกรายการที่มีปัญหา" })).not.toBeInTheDocument();
});
