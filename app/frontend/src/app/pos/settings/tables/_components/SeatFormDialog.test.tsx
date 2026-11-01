import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { resetTablesAdminMock } from "@/mocks/tables-admin";
import { renderWithClient } from "@/test/renderWithClient";
import { SeatFormDialog } from "./SeatFormDialog";

beforeEach(() => {
  resetTablesAdminMock();
});

test("AC-2 creates a new seat successfully", async () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  renderWithClient(
    <SeatFormDialog seat={null} isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
  );

  const dialog = screen.getByRole("dialog", { name: "เพิ่มที่นั่ง" });
  const input = within(dialog).getByRole("textbox", { name: "ชื่อโต๊ะ" });
  await userEvent.type(input, "T7");

  const saveBtn = within(dialog).getByRole("button", { name: "บันทึก" });
  await userEvent.click(saveBtn);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});

test("AC-3 shows duplicate label error inline when seat label is already taken", async () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  renderWithClient(
    <SeatFormDialog seat={null} isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
  );

  const dialog = screen.getByRole("dialog", { name: "เพิ่มที่นั่ง" });
  const input = within(dialog).getByRole("textbox", { name: "ชื่อโต๊ะ" });
  // "T3" is an existing active seat
  await userEvent.type(input, "T3");

  const saveBtn = within(dialog).getByRole("button", { name: "บันทึก" });
  await userEvent.click(saveBtn);

  expect(await within(dialog).findByText("มีชื่อนี้แล้ว")).toBeInTheDocument();
  expect(onSuccess).not.toHaveBeenCalled();
});

test("validates empty seat label", async () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();

  renderWithClient(
    <SeatFormDialog seat={null} isOpen={true} onClose={onClose} onSuccess={onSuccess} />,
  );

  const dialog = screen.getByRole("dialog", { name: "เพิ่มที่นั่ง" });
  const saveBtn = within(dialog).getByRole("button", { name: "บันทึก" });
  expect(saveBtn).toBeDisabled();
});
