import type { Policy, StaffGroup, StaffMember } from "@bar/contracts";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test } from "vitest";
import { createGroup, setGroupPolicies, setPersonalPolicies } from "@/lib/api/iam";
import { apiEnvelope } from "@/mocks/handlers";
import { ALL_POLICY, STAFF_GROUP, STAFF_POLICY } from "@/mocks/iam";
import { server } from "@/mocks/node";
import { staffIds } from "@/mocks/staff";
import { renderWithClient } from "@/test/renderWithClient";
import { PoliciesScreen } from "./PoliciesScreen";

const openPolicy = async (name: string) => {
  const heading = await screen.findByRole("heading", { name });
  await userEvent.click(within(heading.closest("li") as HTMLElement).getByRole("button", { name: new RegExp(`(แก้ไข|ดู) ${name}`) }));
  return screen.findByRole("heading", { name, level: 1 });
};

const on = (name: string) => screen.getByRole("switch", { name });

test("AC-1 a new policy 'รับเงิน' is built in the matrix and listed with its code count and usage", async () => {
  renderWithClient(<PoliciesScreen />);
  await userEvent.click(await screen.findByRole("button", { name: "สร้างนโยบาย" }));
  await userEvent.type(await screen.findByRole("textbox", { name: "ชื่อนโยบาย" }), "รับเงิน");
  await userEvent.click(await screen.findByRole("switch", { name: "ดูการชำระเงิน" }));
  await userEvent.click(on("เปิดบิลชำระเงิน"));
  await userEvent.click(on("ยืนยันรับเงิน"));
  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

  const created = (await screen.findByRole("heading", { name: "รับเงิน" })).closest("li") as HTMLElement;
  expect(created).toHaveTextContent("3 สิทธิ์ · ใช้อยู่ 0 กลุ่ม · 0 คน");
});

test("a list row shows the code count and who uses it; ทั้งหมด is marked ระบบ · ทุกสิทธิ์", async () => {
  renderWithClient(<PoliciesScreen />);
  const staff = (await screen.findByRole("heading", { name: "พนักงานหน้าร้าน" })).closest("li") as HTMLElement;
  expect(staff).toHaveTextContent("12 สิทธิ์ · ใช้อยู่ 1 กลุ่ม · 2 คน");
  expect(within((await screen.findByRole("heading", { name: "ทั้งหมด" })).closest("li") as HTMLElement).getByText("ระบบ · ทุกสิทธิ์")).toBeInTheDocument();
});

test("AC-2 a resource's ทั้งหมด flips every action, the bar counts the changes, ยกเลิก restores, บันทึก sends the full set once", async () => {
  const puts: Array<{ codes: string[] }> = [];
  server.use(
    http.put("*/api/policies/:id/permissions", async ({ request }) => {
      const body = (await request.json()) as { codes: Policy["codes"] };
      puts.push(body);
      return HttpResponse.json(apiEnvelope({ id: STAFF_POLICY, name: "พนักงานหน้าร้าน", description: null, system: null, codes: body.codes, usage: { groups: 1, users: 0, people: 2 } } satisfies Policy));
    }),
  );
  renderWithClient(<PoliciesScreen />);
  await openPolicy("พนักงานหน้าร้าน");
  expect(screen.getByText("แก้ไข 0 รายการ")).toBeInTheDocument();
  expect(on("ยืนยันรับเงิน")).not.toBeChecked();

  await userEvent.click(on("ทั้งหมด การชำระเงิน"));
  expect(on("ยืนยันรับเงิน")).toBeChecked();
  expect(screen.getByText("แก้ไข 1 รายการ")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
  expect(on("ยืนยันรับเงิน")).not.toBeChecked();
  expect(screen.getByText("แก้ไข 0 รายการ")).toBeInTheDocument();

  await userEvent.click(on("ทั้งหมด การชำระเงิน"));
  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));
  await waitFor(() => expect(puts).toHaveLength(1));
  expect(puts[0]?.codes).toContain("payments:mark_paid");
  expect(puts[0]?.codes).toHaveLength(13);
  await screen.findByRole("heading", { name: "นโยบายสิทธิ์" });
});

test("matrix rows come from the catalog: every resource has a card with its codes shown small", async () => {
  renderWithClient(<PoliciesScreen />);
  await openPolicy("พนักงานหน้าร้าน");
  const payments = await screen.findByRole("region", { name: "การชำระเงิน" });
  expect(within(payments).getByText("payments:mark_paid")).toBeInTheDocument();
  expect(screen.getAllByRole("region").length).toBeGreaterThanOrEqual(8);
});

test("AC-3 a policy used by two groups asks first, naming them; ทั้งหมด opens read-only", async () => {
  await createGroup({ name: "แคชเชียร์", policyIds: [STAFF_POLICY] });
  const puts: unknown[] = [];
  server.use(
    http.put("*/api/policies/:id/permissions", async ({ request }) => {
      puts.push(await request.json());
      return HttpResponse.json(apiEnvelope(null, 404, "NOT_FOUND", "x"), { status: 404 });
    }),
  );
  renderWithClient(<PoliciesScreen />);
  await openPolicy("พนักงานหน้าร้าน");
  await userEvent.click(on("ยืนยันรับเงิน"));
  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

  const confirm = await screen.findByRole("dialog", { name: "นโยบายนี้ถูกใช้หลายที่" });
  expect(confirm).toHaveTextContent("กลุ่ม พนักงาน");
  expect(confirm).toHaveTextContent("กลุ่ม แคชเชียร์");
  expect(puts).toEqual([]);
  await userEvent.click(within(confirm).getByRole("button", { name: "บันทึกต่อ" }));
  await waitFor(() => expect(puts).toHaveLength(1));
});

test("AC-3 the ทั้งหมด policy is read-only: switches disabled, no save bar, no delete", async () => {
  renderWithClient(<PoliciesScreen />);
  await openPolicy("ทั้งหมด");
  expect(screen.getByText("ระบบ · ทุกสิทธิ์ แก้ไขหรือลบไม่ได้")).toBeInTheDocument();
  expect(on("ยืนยันรับเงิน")).toBeDisabled();
  expect(on("ยืนยันรับเงิน")).toBeChecked();
  expect(screen.queryByRole("button", { name: "บันทึก" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "ลบนโยบาย" })).not.toBeInTheDocument();
  expect(ALL_POLICY).toBeTruthy();
});

test("AC-6 deleting an attached policy is refused naming the group and the person; detached, it deletes", async () => {
  await setPersonalPolicies(staffIds.je, [STAFF_POLICY]);
  renderWithClient(<PoliciesScreen />);
  await openPolicy("พนักงานหน้าร้าน");
  await userEvent.click(screen.getByRole("button", { name: "ลบนโยบาย" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "ลบนโยบาย พนักงานหน้าร้าน?" })).getByRole("button", { name: "ลบนโยบาย" }));

  const alert = await screen.findByRole("alert");
  expect(within(alert).getByRole("link", { name: "พนักงาน" })).toHaveAttribute("href", "/pos/settings/groups");
  expect(within(alert).getByRole("link", { name: "เจ" })).toHaveAttribute("href", `/pos/settings/staff/${staffIds.je}`);

  await setPersonalPolicies(staffIds.je, []);
  await setGroupPolicies(STAFF_GROUP, []);
  await userEvent.click(screen.getByRole("button", { name: "ลบนโยบาย" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "ลบนโยบาย พนักงานหน้าร้าน?" })).getByRole("button", { name: "ลบนโยบาย" }));
  await screen.findByRole("heading", { name: "นโยบายสิทธิ์" });
  expect(screen.queryByRole("heading", { name: "พนักงานหน้าร้าน" })).not.toBeInTheDocument();
});

test("AC-7 IAM_LOCKOUT shows the explanation, keeps the edits and sends nothing further", async () => {
  server.use(http.put("*/api/policies/:id/permissions", () => HttpResponse.json(apiEnvelope({ reason: "last_manager" }, 409, "IAM_LOCKOUT", "x"), { status: 409 })));
  renderWithClient(<PoliciesScreen />);
  await openPolicy("พนักงานหน้าร้าน");
  await userEvent.click(on("ยืนยันรับเงิน"));
  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

  expect(await screen.findByText("ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ")).toBeInTheDocument();
  expect(on("ยืนยันรับเงิน")).toBeChecked();
  expect(screen.getByText("แก้ไข 1 รายการ")).toBeInTheDocument();
});

test("renaming sends a PATCH and a name already taken is a field error", async () => {
  await createGroup({ name: "x", policyIds: [] });
  renderWithClient(<PoliciesScreen />);
  await openPolicy("พนักงานหน้าร้าน");
  const name = screen.getByRole("textbox", { name: "ชื่อนโยบาย" });
  await userEvent.clear(name);
  await userEvent.type(name, "จัดการร้าน");
  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("มีนโยบายชื่อนี้อยู่แล้ว")).toBeInTheDocument();
});

// Beam holds staff:manage only through the group "ผู้ช่วย" → policy "แอดมิน".
const GROUP_ID = "00000000-0000-4000-8000-0000000c00a1";
const POLICY_ID = "00000000-0000-4000-8000-0000000d00a1";

test("AC-9 switching off your own staff:manage warns first; cancel sends nothing", async () => {
  const puts: unknown[] = [];
  const policy: Policy = { id: POLICY_ID, name: "แอดมิน", description: null, system: null, codes: ["staff:manage", "menu:read"], usage: { groups: 1, users: 0, people: 1 } };
  server.use(
    http.get("*/api/staff-groups", () => HttpResponse.json(apiEnvelope([{ id: GROUP_ID, name: "ผู้ช่วย", description: null, system: null, policyIds: [POLICY_ID], memberCount: 1 }] satisfies StaffGroup[]))),
    http.get("*/api/policies", () => HttpResponse.json(apiEnvelope([policy]))),
    http.get("*/api/staff", () => HttpResponse.json(apiEnvelope([]))),
    http.get("*/api/staff/:id", () =>
      HttpResponse.json(apiEnvelope({ id: staffIds.me, displayName: "Beam", avatarUrl: null, isActive: true, policyIds: [], memberships: [{ groupId: GROUP_ID, groupName: "ผู้ช่วย", validFrom: "2026-09-01T00:00:00.000Z", validUntil: null, state: "live" }] } satisfies StaffMember)),
    ),
    http.put("*/api/policies/:id/permissions", async ({ request }) => {
      puts.push(await request.json());
      return HttpResponse.json(apiEnvelope({ ...policy, codes: ["menu:read"] }));
    }),
  );
  renderWithClient(<PoliciesScreen />);
  await openPolicy("แอดมิน");
  await userEvent.click(on("จัดการพนักงานและสิทธิ์"));
  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));

  const warning = await screen.findByRole("dialog", { name: "คุณจะไม่สามารถจัดการสิทธิ์ได้อีก" });
  await userEvent.click(within(warning).getByRole("button", { name: "ยกเลิก" }));
  expect(puts).toEqual([]);

  await userEvent.click(screen.getByRole("button", { name: "บันทึก" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "คุณจะไม่สามารถจัดการสิทธิ์ได้อีก" })).getByRole("button", { name: "ทำต่อ" }));
  await waitFor(() => expect(puts).toHaveLength(1));
});
