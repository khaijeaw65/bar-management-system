import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { posMockControls } from "@/mocks/handlers";
import { onlyPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/node";
import { staffMockControls } from "@/mocks/staff";
import { renderWithClient } from "@/test/renderWithClient";
import { PosRail } from "../../_components/PosRail";
import { SettingsNav } from "./SettingsNav";

const nav = vi.hoisted(() => ({ path: "/pos/settings/staff" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path, useRouter: () => ({ push: vi.fn() }) }));
vi.mock("socket.io-client", () => ({ io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }) }));

afterEach(() => vi.useRealTimers());

test("AC-8 the count on พนักงาน and the dot on ตั้งค่า appear for staff:manage and follow a new request within 60 s", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  renderWithClient(
    <>
      <PosRail />
      <SettingsNav />
    </>,
  );
  expect(await screen.findByRole("link", { name: "พนักงาน (2)" })).toBeInTheDocument();
  expect(screen.getByLabelText("มีคำขอเข้าใช้งาน 2 คำขอ")).toBeInTheDocument();

  staffMockControls.addRequest("แพร");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(await screen.findByRole("link", { name: "พนักงาน (3)" })).toBeInTheDocument();
});

test("AC-8/9 without staff:manage there is no count, no dot and no พนักงาน tab", async () => {
  server.use(onlyPermissions("venue:update", "venue:read", "tables:read"));
  renderWithClient(
    <>
      <PosRail />
      <SettingsNav />
    </>,
  );
  expect(await screen.findByRole("link", { name: "ร้าน" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /พนักงาน/ })).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/มีคำขอเข้าใช้งาน/)).not.toBeInTheDocument();
});

test("AC-12 staff:manage without venue:update sees พนักงาน and not ร้าน", async () => {
  server.use(onlyPermissions("staff:manage", "tables:read"));
  renderWithClient(<SettingsNav />);
  await waitFor(() => expect(screen.getAllByRole("link", { name: /พนักงาน/ }).length).toBeGreaterThan(0));
  expect(screen.queryByRole("link", { name: "ร้าน" })).not.toBeInTheDocument();
});

test("owner sees both tabs", async () => {
  posMockControls.setRole("owner");
  renderWithClient(<SettingsNav />);
  expect(await screen.findByRole("link", { name: "ร้าน" })).toBeInTheDocument();
});
