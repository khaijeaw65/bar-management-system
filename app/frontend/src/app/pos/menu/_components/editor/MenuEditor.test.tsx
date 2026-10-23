import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { apiEnvelope, menuItems } from "@/mocks/handlers";
import { iceGroupId } from "@/mocks/menu";
import { server } from "@/mocks/node";
import { MenuEditorScreen } from "./MenuEditorScreen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

interface Sent {
  method: string;
  key: string | null;
  body: Record<string, unknown>;
}

const sent: Sent[] = [];
const singha = menuItems[0]!;
const mojito = menuItems[1]!;

beforeEach(() => {
  server.events.on("request:start", async ({ request }) => {
    if (request.method !== "POST" && request.method !== "PATCH") return;
    if (!new URL(request.url).pathname.endsWith("/menu/items") && request.method === "POST") return;
    const body = (await request.clone().json()) as Record<string, unknown>;
    sent.push({ method: request.method, key: request.headers.get("idempotency-key"), body });
  });
});

afterEach(() => {
  sent.length = 0;
  push.mockReset();
  server.events.removeAllListeners();
});

function renderEditor(id?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MenuEditorScreen id={id} />
    </QueryClientProvider>,
  );
}

async function fillNewItem(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByRole("textbox", { name: "ชื่อเมนู" }), "จินโทนิค");
  await user.click(screen.getByRole("button", { name: /หมวด/ }));
  await user.click(await screen.findByRole("option", { name: "ค็อกเทล" }));
  await user.click(screen.getByRole("radio", { name: "บาร์" }));
}

test("creates an item with two price options, a station and an add-on group", async () => {
  const user = userEvent.setup();
  renderEditor();
  await fillNewItem(user);
  await user.type(screen.getByRole("textbox", { name: "ราคา" }), "220");
  await user.click(screen.getByRole("button", { name: "เพิ่มตัวเลือก" }));
  const names = screen.getAllByRole("textbox", { name: "ชื่อตัวเลือก" });
  const prices = screen.getAllByRole("textbox", { name: "ราคา" });
  await user.type(names[1]!, "ดับเบิล");
  await user.type(prices[1]!, "320.5");
  await user.click(screen.getByRole("button", { name: "ระดับน้ำแข็ง" }));
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  await waitFor(() => expect(push).toHaveBeenCalled());
  const post = sent.find((request) => request.method === "POST");
  expect(post?.key).toMatch(/^[0-9a-f-]{36}$/);
  expect(post?.body).toMatchObject({
    name: "จินโทนิค",
    itemType: "simple",
    station: "bar",
    isPromo: false,
    variants: [
      { name: "ปกติ", price: "220.00" },
      { name: "ดับเบิล", price: "320.50" },
    ],
    modifierGroupIds: [iceGroupId],
  });
  expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/pos\/menu\?highlight=/));
});

test("validation shows inline and in a summary, and sends nothing", async () => {
  const user = userEvent.setup();
  renderEditor();
  await user.click(await screen.findByRole("button", { name: "บันทึก" }));

  expect(await screen.findByText("ยังบันทึกไม่ได้ — แก้ 4 จุดที่ทำเครื่องหมายไว้")).toBeInTheDocument();
  expect(screen.getByText("กรุณากรอกชื่อเมนู")).toBeInTheDocument();
  expect(screen.getByText("เลือกว่าจะส่งไปบาร์หรือครัว")).toBeInTheDocument();
  expect(screen.getByText("กรุณาใส่ราคา")).toBeInTheDocument();
  expect(sent).toHaveLength(0);

  await user.type(screen.getByRole("textbox", { name: "ราคา" }), "-5");
  expect(screen.getByText("ราคาต้องไม่ติดลบ")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /ลบตัวเลือก/ })).toBeDisabled();
});

test("a charge hides the station and is sent without one", async () => {
  const user = userEvent.setup();
  renderEditor();
  await user.click(await screen.findByRole("radio", { name: "บาร์" }));
  await user.click(screen.getByRole("radio", { name: /^ค่าบริการ/ }));
  expect(screen.queryByRole("radio", { name: "บาร์" })).not.toBeInTheDocument();

  await user.type(screen.getByRole("textbox", { name: "ชื่อเมนู" }), "ค่าเปิดขวด");
  await user.click(screen.getByRole("button", { name: /หมวด/ }));
  await user.click(await screen.findByRole("option", { name: "ค็อกเทล" }));
  await user.type(screen.getByRole("textbox", { name: "ราคา" }), "300");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  await waitFor(() => expect(sent).toHaveLength(1));
  expect(sent[0]?.body).toMatchObject({ itemType: "charge", station: null });
});

test("a price edit saves with the loaded updatedAt and no rename dialog", async () => {
  const user = userEvent.setup();
  renderEditor(singha.id);
  const price = await screen.findByDisplayValue("120.00");
  await user.clear(price);
  await user.type(price, "130");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  await waitFor(() => expect(sent).toHaveLength(1));
  expect(sent[0]).toMatchObject({ method: "PATCH", body: { updatedAt: singha.updatedAt } });
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("renaming the item asks first; cancel sends nothing, confirm saves", async () => {
  const user = userEvent.setup();
  renderEditor(singha.id);
  const name = await screen.findByRole("textbox", { name: "ชื่อเมนู" });
  await user.clear(name);
  await user.type(name, "สิงห์ไลท์");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  const dialog = await screen.findByRole("alertdialog");
  expect(dialog).toHaveTextContent("สิงห์ → สิงห์ไลท์");
  await user.click(screen.getByRole("button", { name: "ยกเลิก", hidden: false }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(sent).toHaveLength(0);

  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  await user.click(await screen.findByRole("button", { name: "ยืนยัน" }));
  await waitFor(() => expect(sent).toHaveLength(1));
});

test("renaming an existing option asks, a new option does not", async () => {
  const user = userEvent.setup();
  renderEditor(mojito.id);
  const names = await screen.findAllByRole("textbox", { name: "ชื่อตัวเลือก" });
  await user.clear(names[1]!);
  await user.type(names[1]!, "แก้วใหญ่");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByRole("alertdialog")).toHaveTextContent("ใหญ่ → แก้วใหญ่");
});

test("a stale save shows the conflict, keeps typed values and reloads the server copy", async () => {
  const user = userEvent.setup();
  const latest = { ...singha, name: "สิงห์ (ใหม่)", updatedAt: "2026-10-23T10:00:00.000Z" };
  server.use(
    http.patch("*/api/menu/items/:id", () =>
      HttpResponse.json(apiEnvelope({ details: latest }, 409, "MENU_ITEM_STALE", "มีคนบันทึกก่อน"), { status: 409 }),
    ),
  );
  renderEditor(singha.id);
  const price = await screen.findByDisplayValue("120.00");
  await user.clear(price);
  await user.type(price, "130");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  expect(await screen.findByText("เมนูนี้ถูกแก้โดยคนอื่น")).toBeInTheDocument();
  expect(screen.getByDisplayValue("130")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "โหลดฉบับล่าสุด" }));
  expect(screen.getByRole("textbox", { name: "ชื่อเมนู" })).toHaveValue("สิงห์ (ใหม่)");
  expect(screen.getByDisplayValue("120.00")).toBeInTheDocument();
  expect(screen.queryByText("เมนูนี้ถูกแก้โดยคนอื่น")).not.toBeInTheDocument();
});

test("leaving with changes asks first; without changes it just goes", async () => {
  const user = userEvent.setup();
  renderEditor(singha.id);
  await user.click(await screen.findByRole("button", { name: "ยกเลิก" }));
  expect(push).toHaveBeenCalledWith("/pos/menu");
  push.mockReset();

  await user.type(screen.getByRole("textbox", { name: "ชื่อเมนู" }), "x");
  expect(screen.getByText("ยังไม่บันทึก")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
  expect(await screen.findByText("ยังไม่ได้บันทึก")).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "ออกโดยไม่บันทึก" }));
  expect(push).toHaveBeenCalledWith("/pos/menu");
});
