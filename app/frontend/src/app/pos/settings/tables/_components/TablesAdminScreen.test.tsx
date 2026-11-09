import { Toast } from "@heroui/react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { resetTablesAdminMock } from "@/mocks/tables-admin";
import { renderWithClient } from "@/test/renderWithClient";
import { TablesAdminScreen } from "./TablesAdminScreen";

beforeEach(() => {
  resetTablesAdminMock();
});

test("AC-1 renders sections for counter and tables with status chips and seats", async () => {
  renderWithClient(
    <>
      <Toast.Provider placement="top end" />
      <TablesAdminScreen />
    </>,
  );

  expect(await screen.findByRole("heading", { name: "โต๊ะและที่นั่ง", level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "โต๊ะ", level: 2 })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "เคาน์เตอร์", level: 2 })).toBeInTheDocument();

  // Check seat labels
  expect(await screen.findByText("T3")).toBeInTheDocument();
  expect(screen.getByText("C1")).toBeInTheDocument();

  // Check status chips
  const rowT3 = (await screen.findByText("T3")).closest("li")!;
  expect(within(rowT3).getByText("มีแขก")).toBeInTheDocument();

  const rowC1 = (await screen.findByText("C1")).closest("li")!;
  expect(within(rowC1).getByText("ใช้งาน")).toBeInTheDocument();
});

test("AC-5 deactivating a seat with active visit shows SEAT_IN_USE error and remains active", async () => {
  renderWithClient(
    <>
      <Toast.Provider placement="top end" />
      <TablesAdminScreen />
    </>,
  );

  const rowT3 = (await screen.findByText("T3")).closest("li")!;
  const switchT3 = within(rowT3).getByRole("switch");
  expect(switchT3).toBeChecked();

  await userEvent.click(switchT3);

  expect(await screen.findByText(/มีแขกอยู่ที่โต๊ะนี้ ปิดโต๊ะก่อน/)).toBeInTheDocument();
  expect(switchT3).toBeChecked();
});

test("AC-4 moves seat up or down within section", async () => {
  renderWithClient(
    <>
      <Toast.Provider placement="top end" />
      <TablesAdminScreen />
    </>,
  );

  // T5 is index 2 in table section; move it up
  const rowT5 = (await screen.findByText("T5")).closest("li")!;
  const upButton = within(rowT5).getByRole("button", { name: "เลื่อน T5 ขึ้น" });

  await userEvent.click(upButton);

  await waitFor(() => {
    const listItems = screen.getAllByRole("listitem");
    const t5Index = listItems.findIndex((li) => li.textContent?.includes("T5"));
    const t3Index = listItems.findIndex((li) => li.textContent?.includes("T3"));
    // T5 moved ahead of T3 or swapped
    expect(t5Index).toBeLessThan(t3Index);
  });
});
