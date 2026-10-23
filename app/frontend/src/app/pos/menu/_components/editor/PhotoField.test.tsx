import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { menuItems } from "@/mocks/handlers";
import { mockBucket, mockImageUrl } from "@/mocks/menu";
import { server } from "@/mocks/node";
import { MenuEditorScreen } from "./MenuEditorScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const singha = menuItems[0]!;
let presigns = 0;
let patches: Record<string, unknown>[] = [];

beforeEach(() => {
  presigns = 0;
  patches = [];
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  server.events.on("request:start", async ({ request }) => {
    const path = new URL(request.url).pathname;
    if (path.endsWith("/image-upload-url")) presigns += 1;
    if (request.method === "PATCH") patches.push((await request.clone().json()) as Record<string, unknown>);
  });
});

afterEach(() => server.events.removeAllListeners());

function renderEditor() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MenuEditorScreen id={singha.id} />
    </QueryClientProvider>,
  );
}

const jpg = (bytes = 10) => new File([new Uint8Array(bytes)], "gin.jpg", { type: "image/jpeg" });
const picker = async () => (await screen.findByLabelText("เลือกไฟล์รูป")) as HTMLInputElement;
// The picker's accept filter would drop a GIF before our check runs.
const setup = () => userEvent.setup({ applyAccept: false });

test("a valid JPG uploads, previews and saves its tmp key", async () => {
  const user = setup();
  renderEditor();
  await user.upload(await picker(), jpg());

  expect(await screen.findByRole("img", { name: "รูปเมนู" })).toHaveAttribute("src", "blob:preview");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  await waitFor(() => expect(patches).toHaveLength(1));
  expect(patches[0]?.imageKey).toMatch(/^tmp\/.+\.jpg$/);
});

test("a 6 MB file or a GIF shows the error and never asks for a URL", async () => {
  const user = setup();
  renderEditor();
  await user.upload(await picker(), jpg(6 * 1024 * 1024));
  expect(await screen.findByText("ไฟล์ต้องเป็น JPG, PNG หรือ WebP ไม่เกิน 5 MB")).toBeInTheDocument();
  await user.upload(await picker(), new File([new Uint8Array(5)], "a.gif", { type: "image/gif" }));
  expect(screen.getByText("อัปโหลดไม่สำเร็จ")).toBeInTheDocument();
  expect(presigns).toBe(0);
});

test("an S3 rejection shows the error; a new file retries", async () => {
  const user = setup();
  server.use(http.post(mockBucket, () => new HttpResponse(null, { status: 403 }), { once: true }));
  renderEditor();
  await user.upload(await picker(), jpg());
  expect(await screen.findByText("อัปโหลดไม่สำเร็จ")).toBeInTheDocument();

  await user.upload(await picker(), jpg());
  await waitFor(() => expect(screen.queryByText("อัปโหลดไม่สำเร็จ")).not.toBeInTheDocument());
  expect(screen.getByRole("img", { name: "รูปเมนู" })).toHaveAttribute("src", "blob:preview");
  expect(presigns).toBe(2);
});

test("remove saves imageKey null; an untouched photo sends no imageKey", async () => {
  const user = setup();
  renderEditor();
  await screen.findByRole("button", { name: "บันทึก" });
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  await waitFor(() => expect(patches).toHaveLength(1));
  expect(patches[0]).not.toHaveProperty("imageKey");
});

test("remove on a saved photo sends null", async () => {
  const user = setup();
  server.use(http.get("*/api/menu/items/:id", () =>
    HttpResponse.json({ status: 200, code: "", message: "success", data: { ...singha, imageUrl: mockImageUrl } }),
  ));
  renderEditor();
  await user.click(await screen.findByRole("button", { name: "ลบรูป" }));
  expect(screen.queryByRole("img", { name: "รูปเมนู" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  await waitFor(() => expect(patches).toHaveLength(1));
  expect(patches[0]?.imageKey).toBeNull();
});

test("save is disabled while uploading; cancel aborts and restores the previous photo", async () => {
  const user = setup();
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  server.use(http.post(mockBucket, async () => {
    await gate;
    return new HttpResponse(null, { status: 204 });
  }));
  server.use(http.get("*/api/menu/items/:id", () =>
    HttpResponse.json({ status: 200, code: "", message: "success", data: { ...singha, imageUrl: mockImageUrl } }),
  ));
  renderEditor();
  await user.upload(await picker(), jpg());

  expect(await screen.findByText(/กำลังอัปโหลด/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "บันทึก" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "ยกเลิกการอัปโหลด" }));

  expect(screen.getByRole("button", { name: "บันทึก" })).toBeEnabled();
  expect(screen.getByRole("img", { name: "รูปเมนู" })).toHaveAttribute("src", mockImageUrl);
  release();
  expect(patches).toHaveLength(0);
});
