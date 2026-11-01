import type { SeatAdmin } from "@bar/contracts";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { resetTablesAdminMock } from "@/mocks/tables-admin";
import { renderWithClient } from "@/test/renderWithClient";
import { QrPrintModal } from "./QrPrintModal";

beforeEach(() => {
  resetTablesAdminMock();
});

const mockSeat: SeatAdmin = {
  id: "10000000-0000-4000-8000-000000000003",
  label: "T3",
  kind: "table",
  sortOrder: 1,
  isActive: true,
  qrToken: "mock-qr-token-t3-test",
  hasLiveVisit: true,
};

test("AC-6 renders modal with SVG QR code, venue title, and print triggers", async () => {
  const onClose = vi.fn();
  const onRegenerate = vi.fn();

  renderWithClient(
    <QrPrintModal
      seat={mockSeat}
      isOpen={true}
      onClose={onClose}
      onRegenerate={onRegenerate}
    />,
  );

  const modal = screen.getByRole("dialog", { name: "QR โต๊ะ T3" });
  expect(modal).toBeInTheDocument();
  expect(within(modal).getByRole("img", { name: "QR โต๊ะ T3" })).toBeInTheDocument();
  expect(within(modal).getByText("The Loft Bar")).toBeInTheDocument();
  expect(within(modal).getByText("สแกนเพื่อสั่งอาหารและเครื่องดื่ม")).toBeInTheDocument();
  expect(within(modal).getByRole("button", { name: "พิมพ์" })).toBeInTheDocument();
  expect(within(modal).getByRole("button", { name: "สร้าง QR ใหม่" })).toBeInTheDocument();
});

test("AC-6 regenerate QR prompts with confirm dialog and confirms successfully", async () => {
  const onClose = vi.fn();
  const onRegenerate = vi.fn();

  renderWithClient(
    <QrPrintModal
      seat={mockSeat}
      isOpen={true}
      onClose={onClose}
      onRegenerate={onRegenerate}
    />,
  );

  const modal = screen.getByRole("dialog", { name: "QR โต๊ะ T3" });
  await userEvent.click(within(modal).getByRole("button", { name: "สร้าง QR ใหม่" }));

  const confirmDialog = screen.getByRole("alertdialog");
  expect(confirmDialog).toBeInTheDocument();
  expect(within(confirmDialog).getByText(/QR เดิมจะใช้ไม่ได้ทันที/)).toBeInTheDocument();

  // Test cancel first
  await userEvent.click(within(confirmDialog).getByRole("button", { name: "ยกเลิก" }));
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  expect(onRegenerate).not.toHaveBeenCalled();

  // Open again and confirm
  await userEvent.click(within(modal).getByRole("button", { name: "สร้าง QR ใหม่" }));
  const confirmDialog2 = screen.getByRole("alertdialog");
  await userEvent.click(within(confirmDialog2).getByRole("button", { name: "ยืนยัน" }));

  await waitFor(() => {
    expect(onRegenerate).toHaveBeenCalledWith(expect.stringContaining("mock-qr-token-t3"));
  });
});
