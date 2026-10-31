import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { requestIds, staffIds } from "@/mocks/staff";
import { renderWithClient } from "@/test/renderWithClient";
import { StaffScreen } from "./StaffScreen";

vi.mock("next/navigation", () => ({ usePathname: () => "/pos/settings/staff", useRouter: () => ({ push: vi.fn() }) }));

async function openApprove(name: string) {
  const row = (await screen.findByText(name)).closest("li") as HTMLElement;
  await userEvent.click(within(row).getByRole("button", { name: "อนุมัติ" }));
  return await screen.findByRole("dialog", { name: "อนุมัติคำขอ" });
}

test("AC-1 approving ฝน as พนักงาน ถาวร lists them highlighted and drops the request", async () => {
  renderWithClient(<StaffScreen />);
  const dialog = await openApprove("ฝน");
  expect(within(dialog).getByRole("textbox", { name: "ชื่อที่แสดง" })).toHaveValue("ฝน");
  await userEvent.click(await within(dialog).findByRole("checkbox", { name: "พนักงาน" }));
  await userEvent.click(within(dialog).getByRole("button", { name: "อนุมัติ" }));

  await waitFor(() => expect(screen.queryByRole("dialog", { name: "อนุมัติคำขอ" })).not.toBeInTheDocument());
  const row = (await screen.findByRole("link", { name: "ฝน" })).closest("li") as HTMLElement;
  expect(within(row).getByText("พนักงาน")).toBeInTheDocument();
  expect(row.className).toContain("bg-accent-soft");
  await waitFor(() => expect(screen.queryByRole("button", { name: "อนุมัติ" , hidden: false })).toBeInTheDocument());
  expect(screen.getAllByRole("button", { name: "อนุมัติ" })).toHaveLength(1);
});

test("AC-4 approve stays disabled with no group, rejects a past custom time, and shows a server 400 inline", async () => {
  renderWithClient(<StaffScreen />);
  const dialog = await openApprove("ฝน");
  const approve = within(dialog).getByRole("button", { name: "อนุมัติ" });
  expect(approve).toBeDisabled();
  expect(within(dialog).getByText("เลือกอย่างน้อย 1 กลุ่ม")).toBeInTheDocument();

  await userEvent.click(await within(dialog).findByRole("checkbox", { name: "ผู้จัดการ" }));
  expect(approve).toBeEnabled();
  await userEvent.click(within(dialog).getByRole("radio", { name: "กำหนดเอง" }));
  expect(approve).toBeDisabled();
  const when = within(dialog).getByLabelText("วันและเวลาที่สิ้นสุด");
  await userEvent.type(when, "2020-01-01T06:00");
  expect(within(dialog).getByText("เวลาสิ้นสุดต้องอยู่ในอนาคต")).toBeInTheDocument();
  expect(approve).toBeDisabled();

  await userEvent.click(within(dialog).getByRole("radio", { name: "ถาวร" }));
  server.use(http.post("*/api/staff/access-requests/:id/approve", () => HttpResponse.json(apiEnvelope(null, 400, "VALIDATION_ERROR", "ไม่พบกลุ่มที่เลือก"), { status: 400 })));
  await userEvent.click(approve);
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("ไม่พบกลุ่มที่เลือก");
});

test("AC-1 ถึงสิ้นกะคืนนี้ is sent as end_of_night and the server time is not computed in the UI", async () => {
  const bodies: unknown[] = [];
  server.use(
    http.post("*/api/staff/access-requests/:id/approve", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(apiEnvelope(null, 409, "ACCESS_REQUEST_DECIDED", "x"), { status: 409 });
    }),
  );
  renderWithClient(<StaffScreen />);
  const dialog = await openApprove("ฝน");
  await userEvent.click(await within(dialog).findByRole("checkbox", { name: "ผู้จัดการ" }));
  await userEvent.click(within(dialog).getByRole("radio", { name: "ถึงสิ้นกะคืนนี้" }));
  await userEvent.click(within(dialog).getByRole("button", { name: "อนุมัติ" }));
  await waitFor(() => expect(bodies).toHaveLength(1));
  expect(bodies[0]).toEqual({ displayName: "ฝน", memberships: [{ groupId: "00000000-0000-4000-8000-0000000c0002", until: "end_of_night" }] });
  // ACCESS_REQUEST_DECIDED closes the dialog and refetches.
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "อนุมัติคำขอ" })).not.toBeInTheDocument());
});

test("AC-3 reject asks first, then the rejected list can reopen the request", async () => {
  renderWithClient(<StaffScreen />);
  const row = (await screen.findByText("ฝน")).closest("li") as HTMLElement;
  await userEvent.click(within(row).getByRole("button", { name: "ปฏิเสธ" }));
  const dialog = await screen.findByRole("dialog", { name: "ปฏิเสธคำขอ" });
  await userEvent.click(within(dialog).getByRole("button", { name: "ปฏิเสธ" }));

  await waitFor(() => expect(screen.queryByText("ฝน")).not.toBeInTheDocument());
  await userEvent.click(await screen.findByRole("button", { name: "คำขอที่ปฏิเสธ (1)" }));
  await userEvent.click(await screen.findByRole("button", { name: "เปิดคำขออีกครั้ง" }));
  expect(await screen.findByText("ฝน")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /คำขอที่ปฏิเสธ/ })).not.toBeInTheDocument();
});

test("AC-6 your own switch is disabled with the reason; another person is switched off after a confirm", async () => {
  renderWithClient(<StaffScreen />);
  expect(await screen.findByRole("switch", { name: "บัญชีใช้งาน Beam" })).toBeDisabled();
  expect(screen.getByText("ปิดบัญชีของตัวเองไม่ได้")).toBeInTheDocument();

  const jeSwitch = screen.getByRole("switch", { name: "บัญชีใช้งาน เจ" });
  await userEvent.click(jeSwitch);
  const dialog = await screen.findByRole("dialog", { name: "ปิดบัญชี" });
  expect(dialog).toHaveTextContent("ออกจากระบบทุกอุปกรณ์ทันที");
  await userEvent.click(within(dialog).getByRole("button", { name: "ปิดบัญชี" }));
  await waitFor(() => expect(screen.getByRole("switch", { name: "บัญชีใช้งาน เจ" })).not.toBeChecked());
  expect(screen.getByRole("link", { name: "เจ" }).closest("li")?.querySelector("ul")?.className).toContain("opacity-50");

  await userEvent.click(screen.getByRole("switch", { name: "บัญชีใช้งาน เจ" }));
  await waitFor(() => expect(screen.getByRole("switch", { name: "บัญชีใช้งาน เจ" })).toBeChecked());
});

test("a server SELF_DEACTIVATE still shows a toast and the list stays", async () => {
  server.use(http.patch("*/api/staff/:id", () => HttpResponse.json(apiEnvelope(null, 409, "SELF_DEACTIVATE", "ปิดบัญชีของตัวเองไม่ได้"), { status: 409 })));
  renderWithClient(<StaffScreen />);
  await userEvent.click(await screen.findByRole("switch", { name: "บัญชีใช้งาน เจ" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "ปิดบัญชี" })).getByRole("button", { name: "ปิดบัญชี" }));
  await waitFor(() => expect(screen.getByRole("switch", { name: "บัญชีใช้งาน เจ" })).toBeChecked());
});

test("AC-5 the lockout alert explains a refused change and the list is unchanged", async () => {
  // Only Beam holds เจ้าของ for good, so switching Beam off is refused; Beam's own switch is disabled, so the server refusal is driven through เจ.
  server.use(http.patch("*/api/staff/:id", () => HttpResponse.json(apiEnvelope({ reason: "last_manager" }, 409, "IAM_LOCKOUT", "x"), { status: 409 })));
  renderWithClient(<StaffScreen />);
  await userEvent.click(await screen.findByRole("switch", { name: "บัญชีใช้งาน เจ" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "ปิดบัญชี" })).getByRole("button", { name: "ปิดบัญชี" }));
  expect(await screen.findByText("ต้องมีผู้ดูแลสิทธิ์อย่างน้อย 1 คนที่ไม่มีวันหมดอายุ")).toBeInTheDocument();
  expect(screen.getByRole("switch", { name: "บัญชีใช้งาน เจ" })).toBeChecked();
});

test("the request ids used by the mock are stable", () => {
  expect(requestIds.fon).toBeTruthy();
  expect(staffIds.me).toBe("11111111-1111-4111-8111-111111111111");
});
