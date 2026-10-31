import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { staffIds } from "@/mocks/staff";
import { renderWithClient } from "@/test/renderWithClient";
import { StaffDetailScreen } from "./StaffDetailScreen";

vi.mock("next/navigation", () => ({ usePathname: () => "/pos/settings/staff/x", useRouter: () => ({ push: vi.fn() }) }));

test("AC-7 an expired membership is struck and removing it sends the full set without it", async () => {
  const puts: unknown[] = [];
  server.use(
    http.put("*/api/staff/:id/memberships", async ({ request }) => {
      puts.push(await request.json());
      return HttpResponse.json(apiEnvelope(null, 404, "NOT_FOUND", "x"), { status: 404 });
    }),
  );
  renderWithClient(<StaffDetailScreen staffId={staffIds.mod} />);
  const expired = await screen.findByText("ผู้จัดการ · หมดอายุ");
  expect(expired.closest("[data-slot='chip']")?.className).toContain("line-through");

  await userEvent.click(screen.getByRole("button", { name: "ลบกลุ่ม ผู้จัดการ" }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0]).toEqual({ memberships: [{ groupId: "00000000-0000-4000-8000-0000000c0003", until: "permanent" }] });
});

test("AC-2 adding ผู้จัดการ ถึงสิ้นกะคืนนี้ shows the time-bound chip and the manager codes with their source", async () => {
  renderWithClient(<StaffDetailScreen staffId={staffIds.je} />);
  await screen.findByRole("heading", { name: "สิทธิ์ที่มีตอนนี้" });
  expect(screen.queryByText("กลุ่ม ผู้จัดการ · นโยบาย จัดการร้าน")).not.toBeInTheDocument();

  await userEvent.click(await screen.findByRole("button", { name: "เพิ่มกลุ่ม" }));
  const dialog = await screen.findByRole("dialog", { name: "เพิ่มกลุ่ม" });
  const add = within(dialog).getByRole("button", { name: "เพิ่มกลุ่ม" });
  expect(add).toBeDisabled();
  await userEvent.click(await within(dialog).findByRole("radio", { name: "ผู้จัดการ" }));
  await userEvent.click(within(dialog).getByRole("radio", { name: "ถึงสิ้นกะคืนนี้" }));
  await userEvent.click(add);

  expect(await screen.findByText(/^ผู้จัดการ · ถึง /)).toBeInTheDocument();
  expect((await screen.findAllByText("กลุ่ม ผู้จัดการ · นโยบาย จัดการร้าน")).length).toBeGreaterThan(0);
  expect(screen.getByText("แก้ไขเมนู")).toBeInTheDocument();
});

test("a future membership reads 'เริ่ม …'", async () => {
  const future = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  server.use(
    http.get("*/api/staff/:id", () =>
      HttpResponse.json(
        apiEnvelope({
          id: staffIds.je,
          displayName: "เจ",
          avatarUrl: null,
          isActive: true,
          policyIds: [],
          memberships: [{ groupId: "00000000-0000-4000-8000-0000000c0002", groupName: "ผู้จัดการ", validFrom: future, validUntil: null, state: "future" }],
        }),
      ),
    ),
  );
  renderWithClient(<StaffDetailScreen staffId={staffIds.je} />);
  expect(await screen.findByText(/^ผู้จัดการ · เริ่ม /)).toBeInTheDocument();
});

test("AC-5 removing the only permanent เจ้าของ is refused: the lockout alert shows and the row stays", async () => {
  renderWithClient(<StaffDetailScreen staffId={staffIds.me} />);
  await userEvent.click(await screen.findByRole("button", { name: "ลบกลุ่ม เจ้าของ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ");
  expect(await screen.findByRole("button", { name: "ลบกลุ่ม เจ้าของ" })).toBeInTheDocument();
});

test("effective permissions show personal sources too, read-only", async () => {
  server.use(
    http.get("*/api/staff/:id/effective-permissions", () =>
      HttpResponse.json(apiEnvelope({ permissions: [{ code: "payments:mark_paid", sources: [{ kind: "user", policyName: "รับเงิน" }] }] })),
    ),
  );
  renderWithClient(<StaffDetailScreen staffId={staffIds.je} />);
  expect(await screen.findByText("ส่วนตัว · นโยบาย รับเงิน")).toBeInTheDocument();
  expect(screen.getByText("ยืนยันรับเงิน")).toBeInTheDocument();
});

test("renaming sends only the display name", async () => {
  const patches: unknown[] = [];
  server.events.on("request:start", async ({ request }) => {
    if (request.method === "PATCH") patches.push(await request.clone().json());
  });
  renderWithClient(<StaffDetailScreen staffId={staffIds.je} />);
  const name = await screen.findByRole("textbox", { name: "ชื่อที่แสดง" });
  await userEvent.clear(name);
  await userEvent.type(name, "เจเจ");
  await userEvent.click(screen.getByRole("button", { name: "บันทึกชื่อ" }));
  await waitFor(() => expect(patches).toEqual([{ displayName: "เจเจ" }]));
  server.events.removeAllListeners();
});
