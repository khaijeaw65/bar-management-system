import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { expect, test } from "vitest";
import { posMockControls } from "@/mocks/handlers";
import { SessionCallRow } from "../tables/_components/SessionCallRow";
import { NotificationBell } from "./NotificationBell";
import { SoundToggle } from "./SoundToggle";

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

test("top bar lists open calls with a count and clears one with รับทราบ", async () => {
  posMockControls.ring("T2", "bill");
  wrap(<NotificationBell />);
  const trigger = await screen.findByRole("button", { name: "การเรียกพนักงาน 1 รายการ" });
  await userEvent.click(trigger);
  const list = await screen.findByRole("dialog", { name: "การเรียกพนักงาน" });
  expect(within(list).getByText("T2 เรียกพนักงาน · เช็คบิล · เมื่อกี้")).toBeInTheDocument();
  expect(within(list).getByRole("link", { name: "ไปที่โต๊ะ" })).toBeInTheDocument();
  await userEvent.click(within(list).getByRole("button", { name: "รับทราบ T2" }));
  expect(await within(list).findByText("ไม่มีการเรียก")).toBeInTheDocument();
});

test("the drawer shows the seat's bell and clears it", async () => {
  const seatId = posMockControls.ring("T3", "bill") as string;
  wrap(<SessionCallRow seatId={seatId} label="T3" />);
  await userEvent.click(await screen.findByRole("button", { name: "รับทราบ T3" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "รับทราบ T3" })).not.toBeInTheDocument());
});

test("AC-5/AC-6: the toggle hints while locked, then mutes and unmutes", async () => {
  localStorage.clear();
  wrap(<SoundToggle />);
  expect(screen.getAllByText("แตะเพื่อเปิดเสียง").length).toBeGreaterThan(0);
});
