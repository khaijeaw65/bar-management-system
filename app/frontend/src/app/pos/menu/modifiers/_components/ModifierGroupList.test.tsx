import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { expect, test, vi } from "vitest";
import { modifierGroups } from "@/mocks/menu";
import { server } from "@/mocks/node";
import { recordWrites, renderScreen, sent } from "./testing";

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

recordWrites();

const used = { ...modifierGroups[0]!, id: "e2222222-2222-4222-8222-222222222222", name: "ท็อปปิ้ง", isRequired: false, minSelect: 0, maxSelect: 2, usedByItems: 2 };

test("lists each group with its rule chip, active options and usage", async () => {
  server.use(http.get("*/api/menu/modifier-groups", () => HttpResponse.json({ status: 200, code: "", message: "success", data: { items: [modifierGroups[0], used] } })));
  renderScreen();
  expect(await screen.findByText("ต้องเลือก 1")).toBeInTheDocument();
  expect(screen.getByText("ไม่บังคับ · สูงสุด 2")).toBeInTheDocument();
  expect(screen.getByText("ใช้กับ 2 เมนู")).toBeInTheDocument();
  expect(screen.getAllByText("2 ตัวเลือก").length).toBeGreaterThan(0);
});

test("disables delete for a group in use, with the reason", async () => {
  server.use(http.get("*/api/menu/modifier-groups", () => HttpResponse.json({ status: 200, code: "", message: "success", data: { items: [used] } })));
  renderScreen();
  expect(await screen.findByRole("button", { name: "ลบกลุ่ม ท็อปปิ้ง" })).toBeDisabled();
  expect(screen.getByText("ใช้อยู่ใน 2 เมนู — ถอดออกจากเมนูก่อน")).toBeInTheDocument();
});

test("confirms before deleting an unused group; cancel sends nothing", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: "ลบกลุ่ม ระดับน้ำแข็ง" }));
  expect(await screen.findByText("ลบกลุ่ม ระดับน้ำแข็ง?")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
  expect(sent).toHaveLength(0);

  await user.click(screen.getByRole("button", { name: "ลบกลุ่ม ระดับน้ำแข็ง" }));
  await user.click(await screen.findByRole("button", { name: "ลบ" }));
  await waitFor(() => expect(sent).toEqual([{ method: "DELETE", path: expect.stringMatching(/modifier-groups\//), body: null }]));
  expect(await screen.findByText("ยังไม่มีกลุ่ม")).toBeInTheDocument();
});

test("shows the empty state with an add button", async () => {
  server.use(http.get("*/api/menu/modifier-groups", () => HttpResponse.json({ status: 200, code: "", message: "success", data: { items: [] } })));
  renderScreen();
  expect(await screen.findByText("ยังไม่มีกลุ่ม")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "เพิ่มกลุ่ม" })).toBeInTheDocument();
});
