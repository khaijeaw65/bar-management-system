import type { Policy, StaffGroup, StaffMember } from "@bar/contracts";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { createGroup } from "@/lib/api/iam";
import { replaceMemberships } from "@/lib/api/staff";
import { apiEnvelope } from "@/mocks/handlers";
import { MANAGER_POLICY, STAFF_POLICY } from "@/mocks/iam";
import { server } from "@/mocks/node";
import { staffIds } from "@/mocks/staff";
import { renderWithClient } from "@/test/renderWithClient";
import { GroupsScreen } from "./GroupsScreen";

const row = async (name: string) => (await screen.findByRole("heading", { name })).closest("li") as HTMLElement;

test("AC-1 a custom group is made from existing policies and listed with its chips", async () => {
  renderWithClient(<GroupsScreen />);
  await userEvent.click(await screen.findByRole("button", { name: "สร้างกลุ่ม" }));
  const dialog = await screen.findByRole("dialog", { name: "สร้างกลุ่ม" });
  await userEvent.type(within(dialog).getByRole("textbox", { name: "ชื่อกลุ่ม" }), "แคชเชียร์");
  await userEvent.click(within(dialog).getByRole("checkbox", { name: "พนักงานหน้าร้าน" }));
  await userEvent.click(within(dialog).getByRole("button", { name: "บันทึก" }));

  const created = await row("แคชเชียร์");
  expect(within(created).getByText("พนักงานหน้าร้าน")).toBeInTheDocument();
  expect(within(created).queryByText("ค่าเริ่มต้น")).not.toBeInTheDocument();
});

test("a taken name is a field error and the dialog stays", async () => {
  renderWithClient(<GroupsScreen />);
  await userEvent.click(await screen.findByRole("button", { name: "สร้างกลุ่ม" }));
  const dialog = await screen.findByRole("dialog", { name: "สร้างกลุ่ม" });
  await userEvent.type(within(dialog).getByRole("textbox", { name: "ชื่อกลุ่ม" }), "พนักงาน");
  await userEvent.click(within(dialog).getByRole("button", { name: "บันทึก" }));
  expect(await within(dialog).findByText("มีกลุ่มชื่อนี้อยู่แล้ว")).toBeInTheDocument();
});

test("AC-4 system groups come first with the badge and no delete; เจ้าของ is read-only; ผู้จัดการ keeps its name", async () => {
  renderWithClient(<GroupsScreen />);
  await createGroup({ name: "แคชเชียร์", policyIds: [] });
  const system = await row("เจ้าของ");
  expect(within(system).getByText("ค่าเริ่มต้น")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ลบ เจ้าของ" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ลบ ผู้จัดการ" })).not.toBeInTheDocument();
  const names = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
  expect(names.slice(0, 3)).toEqual(["เจ้าของ", "ผู้จัดการ", "พนักงาน"]);

  await userEvent.click(within(system).getByRole("button", { name: "ดู เจ้าของ" }));
  const owner = await screen.findByRole("dialog", { name: "แก้ไขกลุ่ม" });
  expect(within(owner).getByText("กลุ่มเจ้าของมีทุกสิทธิ์เสมอ")).toBeInTheDocument();
  expect(within(owner).queryByRole("button", { name: "บันทึก" })).not.toBeInTheDocument();
  await userEvent.click(within(owner).getByRole("button", { name: "ปิด" }));

  await userEvent.click(within(await row("ผู้จัดการ")).getByRole("button", { name: "แก้ไข ผู้จัดการ" }));
  const manager = await screen.findByRole("dialog", { name: "แก้ไขกลุ่ม" });
  expect(within(manager).getByRole("textbox", { name: "ชื่อกลุ่ม" })).toBeDisabled();
  expect(within(manager).getByRole("textbox", { name: "คำอธิบาย" })).toBeEnabled();
  expect(within(manager).getByRole("checkbox", { name: "จัดการร้าน" })).toBeEnabled();
});

test("สมาชิก n counts live and future memberships, not the expired one the server still counts", async () => {
  renderWithClient(<GroupsScreen />);
  // มด holds an expired ผู้จัดการ membership; the server's memberCount would say 1.
  const manager = await row("ผู้จัดการ");
  await waitFor(() => expect(within(manager).getByText("สมาชิก 0")).toBeInTheDocument());
  expect(within(await row("พนักงาน")).getByText("สมาชิก 2")).toBeInTheDocument();
});

test("AC-5 the delete dialog names each member and what they lose; someone covered elsewhere loses nothing", async () => {
  const cashier = await createGroup({ name: "แคชเชียร์", policyIds: [STAFF_POLICY] });
  await replaceMemberships(staffIds.je, [{ groupId: cashier.id, until: "permanent" }]);
  await replaceMemberships(staffIds.mod, [
    { groupId: "00000000-0000-4000-8000-0000000c0003", until: "permanent" },
    { groupId: cashier.id, until: "permanent" },
  ]);
  renderWithClient(<GroupsScreen />);
  await userEvent.click(within(await row("แคชเชียร์")).getByRole("button", { name: "ลบ แคชเชียร์" }));

  const dialog = await screen.findByRole("dialog", { name: "ลบกลุ่ม แคชเชียร์?" });
  const je = (await within(dialog).findByText("เจ")).closest("li") as HTMLElement;
  expect(je).toHaveTextContent("จะเสีย:");
  expect(je).toHaveTextContent("เปิดโต๊ะ");
  expect((within(dialog).getByText("มด").closest("li") as HTMLElement)).toHaveTextContent("ไม่เสียสิทธิ์");

  await userEvent.click(within(dialog).getByRole("button", { name: "ลบกลุ่ม" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "แคชเชียร์" })).not.toBeInTheDocument());
});

test("a group nobody is in says no one loses anything", async () => {
  const empty = await createGroup({ name: "ว่าง", policyIds: [] });
  renderWithClient(<GroupsScreen />);
  await userEvent.click(within(await row(empty.name)).getByRole("button", { name: "ลบ ว่าง" }));
  expect(await screen.findByText("ไม่มีใครเสียสิทธิ์")).toBeInTheDocument();
});

test("the server's IAM_LOCKOUT on delete is explained and the group stays", async () => {
  await createGroup({ name: "แคชเชียร์", policyIds: [] });
  server.use(http.delete("*/api/staff-groups/:id", () => HttpResponse.json(apiEnvelope({ reason: "last_manager" }, 409, "IAM_LOCKOUT", "x"), { status: 409 })));
  renderWithClient(<GroupsScreen />);
  await userEvent.click(within(await row("แคชเชียร์")).getByRole("button", { name: "ลบ แคชเชียร์" }));
  const dialog = await screen.findByRole("dialog", { name: "ลบกลุ่ม แคชเชียร์?" });
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "ลบกลุ่ม" })).toBeEnabled());
  await userEvent.click(within(dialog).getByRole("button", { name: "ลบกลุ่ม" }));
  expect(await within(dialog).findByText("ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "แคชเชียร์", hidden: true })).toBeInTheDocument();
});

// Beam reaches staff:manage only through the group "ผู้ช่วย" → policy "แอดมิน".
const GROUP_ID = "00000000-0000-4000-8000-0000000c00a1";
const POLICY_ID = "00000000-0000-4000-8000-0000000d00a1";
const adminOnlyViaGroup = () => [
  http.get("*/api/staff-groups", () =>
    HttpResponse.json(apiEnvelope([{ id: GROUP_ID, name: "ผู้ช่วย", description: null, system: null, policyIds: [POLICY_ID], memberCount: 1 }] satisfies StaffGroup[])),
  ),
  http.get("*/api/policies", () =>
    HttpResponse.json(apiEnvelope([{ id: POLICY_ID, name: "แอดมิน", description: null, system: null, codes: ["staff:manage"], usage: { groups: 1, users: 0, people: 1 } }] satisfies Policy[])),
  ),
  http.get("*/api/staff", () => HttpResponse.json(apiEnvelope([]))),
  http.get("*/api/staff/:id", () =>
    HttpResponse.json(
      apiEnvelope({
        id: staffIds.me,
        displayName: "Beam",
        avatarUrl: null,
        isActive: true,
        policyIds: [],
        memberships: [{ groupId: GROUP_ID, groupName: "ผู้ช่วย", validFrom: "2026-09-01T00:00:00.000Z", validUntil: null, state: "live" }],
      } satisfies StaffMember),
    ),
  ),
];

test("AC-9 deleting the group that gives you staff:manage warns first; cancel sends nothing", async () => {
  const deletes: string[] = [];
  server.use(
    ...adminOnlyViaGroup(),
    http.get("*/api/staff-groups/:id/delete-impact", () => HttpResponse.json(apiEnvelope({ members: [] }))),
    http.delete("*/api/staff-groups/:id", ({ params }) => {
      deletes.push(String(params.id));
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );
  renderWithClient(<GroupsScreen />);
  await userEvent.click(within(await row("ผู้ช่วย")).getByRole("button", { name: "ลบ ผู้ช่วย" }));
  const confirm = await screen.findByRole("dialog", { name: "ลบกลุ่ม ผู้ช่วย?" });
  await waitFor(() => expect(within(confirm).getByRole("button", { name: "ลบกลุ่ม" })).toBeEnabled());
  // The permission queries behind the warning load with the screen.
  await screen.findByText("ผู้ช่วย");
  await userEvent.click(within(confirm).getByRole("button", { name: "ลบกลุ่ม" }));

  const warning = await screen.findByRole("dialog", { name: "คุณจะไม่สามารถจัดการสิทธิ์ได้อีก" });
  expect(deletes).toEqual([]);
  await userEvent.click(within(warning).getByRole("button", { name: "ยกเลิก" }));
  expect(deletes).toEqual([]);

  await userEvent.click(within(confirm).getByRole("button", { name: "ลบกลุ่ม" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "คุณจะไม่สามารถจัดการสิทธิ์ได้อีก" })).getByRole("button", { name: "ทำต่อ" }));
  await waitFor(() => expect(deletes).toEqual([GROUP_ID]));
});

test("MANAGER_POLICY stays attached to ผู้จัดการ in the seed", async () => {
  renderWithClient(<GroupsScreen />);
  expect(within(await row("ผู้จัดการ")).getByText("จัดการร้าน")).toBeInTheDocument();
  expect(MANAGER_POLICY).toBeTruthy();
});
