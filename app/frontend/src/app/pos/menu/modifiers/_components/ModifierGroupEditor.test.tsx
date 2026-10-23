import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { recordWrites, renderScreen, sent } from "./testing";

recordWrites();

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

type User = ReturnType<typeof userEvent.setup>;

async function openNew(user: User) {
  await user.click(await screen.findByRole("button", { name: "เพิ่มกลุ่ม" }));
  await screen.findByRole("textbox", { name: "ชื่อกลุ่ม" });
}

async function fillOption(user: User, index: number, name: string, price: string) {
  await user.type(screen.getAllByRole("textbox", { name: "ชื่อตัวเลือก" })[index]!, name);
  await user.clear(screen.getAllByRole("textbox", { name: "ราคาเพิ่ม" })[index]!);
  await user.type(screen.getAllByRole("textbox", { name: "ราคาเพิ่ม" })[index]!, price);
}

test("creates a group with the schema shape and lists it", async () => {
  const user = userEvent.setup();
  renderScreen();
  await openNew(user);
  await user.type(screen.getByRole("textbox", { name: "ชื่อกลุ่ม" }), "ท็อปปิ้ง");
  await fillOption(user, 0, "ชีส", "20");
  await user.click(screen.getByRole("button", { name: "เพิ่มตัวเลือก" }));
  await fillOption(user, 1, "ไข่ดาว", "10");
  expect(screen.getByText(/ลูกค้าเห็น: ท็อปปิ้ง · ไม่บังคับ · สูงสุด 1/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  await waitFor(() => expect(sent).toHaveLength(1));
  expect(sent[0]).toMatchObject({
    method: "POST",
    body: {
      name: "ท็อปปิ้ง",
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      options: [{ name: "ชีส", priceDelta: "20.00" }, { name: "ไข่ดาว", priceDelta: "10.00" }],
    },
  });
  expect(await screen.findByRole("button", { name: "แก้ไขกลุ่ม ท็อปปิ้ง" })).toBeInTheDocument();
});

test("blocks invalid groups without a request", async () => {
  const user = userEvent.setup();
  renderScreen();
  await openNew(user);
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("กรุณากรอกชื่อกลุ่ม")).toBeInTheDocument();
  expect(screen.getByText("กรุณากรอกชื่อตัวเลือก")).toBeInTheDocument();

  await user.type(screen.getByRole("textbox", { name: "ชื่อกลุ่ม" }), "ก");
  await fillOption(user, 0, "ข", "-5");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("ราคาต้องไม่ติดลบ")).toBeInTheDocument();

  await user.clear(screen.getByRole("textbox", { name: "ราคาเพิ่ม" }));
  await user.click(screen.getByRole("switch", { name: "ขาย ข" }));
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("ต้องมีตัวเลือกอย่างน้อย 1 ตัว")).toBeInTheDocument();
  expect(sent).toHaveLength(0);
});

test("required with minimum 0 is rejected; not required forces the minimum to 0", async () => {
  const user = userEvent.setup();
  renderScreen();
  await openNew(user);
  await user.type(screen.getByRole("textbox", { name: "ชื่อกลุ่ม" }), "ก");
  await fillOption(user, 0, "ข", "0");
  expect(screen.getByRole("textbox", { name: "ขั้นต่ำ" })).toBeDisabled();

  await user.click(screen.getByRole("switch", { name: "ต้องเลือก" }));
  expect(screen.getByRole("textbox", { name: "ขั้นต่ำ" })).toHaveValue("1");
  expect(screen.getByText(/ลูกค้าเห็น.*ต้องเลือก 1/)).toBeInTheDocument();

  await user.clear(screen.getByRole("textbox", { name: "ขั้นต่ำ" }));
  await user.type(screen.getByRole("textbox", { name: "ขั้นต่ำ" }), "0");
  await user.tab();
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("กลุ่มที่บังคับเลือกต้องเลือกอย่างน้อย 1")).toBeInTheDocument();
  expect(sent).toHaveLength(0);
});

test("an option's switch leaves its id out of the PATCH and re-lists it when on again", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: "แก้ไขกลุ่ม ระดับน้ำแข็ง" }));
  await user.click(await screen.findByRole("switch", { name: "ขาย น้ำแข็งน้อย" }));
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  await waitFor(() => expect(sent).toHaveLength(1));
  const first = sent[0]!.body as { options: Array<{ id?: string; name: string }> };
  expect(sent[0]!.method).toBe("PATCH");
  expect(first.options.map((option) => option.name)).toEqual(["ปกติ"]);

  await user.click(await screen.findByRole("button", { name: "แก้ไขกลุ่ม ระดับน้ำแข็ง" }));
  expect(await screen.findByRole("switch", { name: "ขาย น้ำแข็งน้อย" })).not.toBeChecked();
  await user.click(screen.getByRole("switch", { name: "ขาย น้ำแข็งน้อย" }));
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  await waitFor(() => expect(sent).toHaveLength(2));
  const second = sent[1]!.body as { options: Array<{ id?: string; name: string }> };
  expect(second.options.map((option) => option.name)).toEqual(["ปกติ", "น้ำแข็งน้อย"]);
  expect(second.options.every((option) => option.id)).toBe(true);
});

test("maximum above the switched-on options is an inline error", async () => {
  const user = userEvent.setup();
  renderScreen();
  await user.click(await screen.findByRole("button", { name: "แก้ไขกลุ่ม ระดับน้ำแข็ง" }));
  await user.click(await screen.findByRole("switch", { name: "ขาย น้ำแข็งน้อย" }));
  await user.clear(screen.getByRole("textbox", { name: "สูงสุด" }));
  await user.type(screen.getByRole("textbox", { name: "สูงสุด" }), "2");
  await user.tab();
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("เลือกสูงสุดต้องไม่เกินจำนวนตัวเลือก")).toBeInTheDocument();
  expect(sent).toHaveLength(0);
});

test("maximum below the minimum is an inline error", async () => {
  const user = userEvent.setup();
  renderScreen();
  await openNew(user);
  await user.type(screen.getByRole("textbox", { name: "ชื่อกลุ่ม" }), "ก");
  await fillOption(user, 0, "ข", "0");
  await user.click(screen.getByRole("switch", { name: "ต้องเลือก" }));
  await user.clear(screen.getByRole("textbox", { name: "ขั้นต่ำ" }));
  await user.type(screen.getByRole("textbox", { name: "ขั้นต่ำ" }), "2");
  await user.tab();
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("เลือกสูงสุดต้องไม่น้อยกว่าขั้นต่ำ")).toBeInTheDocument();
  expect(sent).toHaveLength(0);
});
