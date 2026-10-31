import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { iamMockControls } from "@/mocks/iam";
import { staffIds } from "@/mocks/staff";
import { renderWithClient } from "@/test/renderWithClient";
import { StaffDetailScreen } from "./StaffDetailScreen";

vi.mock("next/navigation", () => ({ usePathname: () => "/pos/settings/staff/x", useRouter: () => ({ push: vi.fn() }) }));

test("AC-8 a personal policy shows as a chip and in the effective permissions as ส่วนตัว; removing it takes both away", async () => {
  iamMockControls.addPolicy("รับเงิน", ["payments:mark_paid"]);
  renderWithClient(<StaffDetailScreen staffId={staffIds.je} />);
  await screen.findByRole("heading", { name: "สิทธิ์ที่มีตอนนี้" });
  expect(await screen.findByText("ไม่มีนโยบายส่วนตัว")).toBeInTheDocument();
  expect(screen.queryByText("ส่วนตัว · นโยบาย รับเงิน")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "เพิ่มนโยบาย" }));
  const dialog = await screen.findByRole("dialog", { name: "เพิ่มนโยบาย" });
  const add = within(dialog).getByRole("button", { name: "เพิ่มนโยบาย" });
  expect(add).toBeDisabled();
  await userEvent.click(await within(dialog).findByRole("radio", { name: "รับเงิน" }));
  await userEvent.click(add);

  expect(await screen.findByText("ส่วนตัว · นโยบาย รับเงิน")).toBeInTheDocument();
  expect(screen.getByText("ยืนยันรับเงิน")).toBeInTheDocument();
  const section = screen.getByRole("heading", { name: "นโยบายส่วนตัว" }).closest("section") as HTMLElement;
  expect(within(section).getByText("รับเงิน")).toBeInTheDocument();

  await userEvent.click(within(section).getByRole("button", { name: "ถอดนโยบาย รับเงิน" }));
  await waitFor(() => expect(screen.queryByText("ส่วนตัว · นโยบาย รับเงิน")).not.toBeInTheDocument());
  expect(screen.queryByText("ยืนยันรับเงิน")).not.toBeInTheDocument();
});
