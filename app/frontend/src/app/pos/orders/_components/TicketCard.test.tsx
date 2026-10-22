import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { orderLine, ticket } from "../../tables/_components/session.fixture";
import { TicketCard } from "./TicketCard";

function lines(count: number) {
  return Array.from({ length: count }, (_, index) =>
    orderLine(`70000000-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`, `เมนู${index + 1}`),
  );
}

function renderCard(extra: Parameters<typeof ticket>[3] = {}, items = lines(1), kitchenOn = false) {
  const onAct = vi.fn();
  const onOpen = vi.fn();
  render(
    <ul>
      <TicketCard
        ticket={ticket("60000000-0000-4000-8000-000000000101", 45, items, extra)}
        kitchenOn={kitchenOn}
        pending={false}
        fresh={false}
        onOpen={onOpen}
        onAct={onAct}
      />
    </ul>,
  );
  return { onAct, onOpen };
}

test("shows four lines and a remainder count", () => {
  renderCard({}, lines(6));
  expect(screen.getAllByText(/^1× เมนู/)).toHaveLength(4);
  expect(screen.getByText("+ 2 รายการ")).toBeInTheDocument();
});

test("strikes cancelled lines and labels an automatic cancel", () => {
  const cancelled = orderLine("70000000-0000-4000-8000-000000000201", "วิสกี้ซาวร์", {
    cancelledAt: "2026-10-21T12:05:00.000Z",
    cancellation: { at: "2026-10-21T12:05:00.000Z", reason: "ของหมด", by: null, system: true },
  });
  renderCard({}, [cancelled]);
  expect(screen.getByText("1× วิสกี้ซาวร์")).toHaveClass("line-through");
  expect(screen.getByText("ยกเลิกอัตโนมัติ · ของหมด")).toBeInTheDocument();
});

test("the action names the order number and seat and fires its transition", async () => {
  const { onAct } = renderCard();
  await userEvent.setup().click(screen.getByRole("button", { name: "รับออเดอร์ #0045 T3" }));
  expect(onAct).toHaveBeenCalledWith("accept");
});

test("an issue ticket opens the drawer instead of calling a transition", async () => {
  const { onAct, onOpen } = renderCard({ status: "issue" });
  await userEvent.setup().click(screen.getByRole("button", { name: "จัดการปัญหา #0045 T3" }));
  expect(onOpen).toHaveBeenCalled();
  expect(onAct).not.toHaveBeenCalled();
});

test("kitchen on shows the station badge", () => {
  renderCard({ station: "food" }, lines(1), true);
  expect(screen.getByText("ครัว")).toBeInTheDocument();
});

test("the open button holds only phrasing content, not the lines list", () => {
  renderCard({}, lines(2));
  const open = screen.getByRole("button", { name: "ดูรายละเอียด #0045 T3" });
  expect(open.querySelector("ul, li, div, p")).toBeNull();
  expect(open).toHaveTextContent("1× เมนู1");
});
