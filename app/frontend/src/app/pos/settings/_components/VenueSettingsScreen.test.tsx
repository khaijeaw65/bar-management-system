import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { Toast, toast } from "@heroui/react";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { VenueSettingsScreen } from "./VenueSettingsScreen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("socket.io-client", () => ({
  io: () => ({ on() {}, off() {}, connect() {}, disconnect() {}, removeAllListeners() {} }),
}));

afterEach(() => {
  toast.clear();
  resetStaffSocket();
  push.mockReset();
  server.events.removeAllListeners();
});

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        <a href="/pos/tables">ไปหน้าโต๊ะ</a>
        {children}
      </QueryClientProvider>
    );
  }
  render(<VenueSettingsScreen />, { wrapper: Wrap });
  return client;
}

// Another tab turned the kitchen screen on: the server now answers with it, and venue.settings_changed refetches ['venue'].
async function refetchWithKitchenOn(client: QueryClient) {
  server.use(
    http.get("*/api/venue", () =>
      HttpResponse.json(
        apiEnvelope({
          name: "The Loft",
          slug: "the-loft",
          kitchenDisplayEnabled: true,
          businessDayCutoff: "06:00",
          counterQrEnabled: false,
        }),
      ),
    ),
  );
  await client.invalidateQueries({ queryKey: ["venue"] });
}

function bodiesOf(path: string): unknown[] {
  const bodies: unknown[] = [];
  server.events.on("request:start", async ({ request }) => {
    if (request.method === "PATCH" && new URL(request.url).pathname.endsWith(path)) {
      bodies.push(await request.clone().json());
    }
  });
  return bodies;
}

async function setCutoffHour(user: ReturnType<typeof userEvent.setup>, hour: string) {
  // The cut-off is the only time field on the screen; its first segment is the hour.
  const hours = screen.getAllByRole("spinbutton")[0];
  if (!hours) throw new Error("hour segment missing");
  await user.click(hours);
  await user.keyboard(hour);
}

test("saves only the changed name and cut-off in one PATCH, then shows the Toast (AC-5)", async () => {
  const user = userEvent.setup();
  const bodies = bodiesOf("/venue/settings");
  renderScreen();

  const name = await screen.findByRole("textbox", { name: "ชื่อร้าน" });
  await user.clear(name);
  await user.type(name, "The Loft 2");
  await setCutoffHour(user, "05");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
  expect(bodies).toEqual([{ name: "The Loft 2", businessDayCutoff: "05:00" }]);
  expect(screen.getByRole("button", { name: "บันทึก" })).toBeDisabled();
});

test("shows an empty name under the field and blocks the save (AC-5)", async () => {
  const user = userEvent.setup();
  const bodies = bodiesOf("/venue/settings");
  renderScreen();

  await user.clear(await screen.findByRole("textbox", { name: "ชื่อร้าน" }));

  expect(await screen.findByText("กรุณากรอกชื่อร้าน")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "บันทึก" })).toBeDisabled();
  expect(bodies).toEqual([]);
});

test("shows a server 400 in the form alert", async () => {
  server.use(
    http.patch("*/api/venue/settings", () =>
      HttpResponse.json(apiEnvelope(null, 400, "VALIDATION_ERROR", ["ชื่อร้านซ้ำ"]), { status: 400 }),
    ),
  );
  const user = userEvent.setup();
  renderScreen();

  await user.click(await screen.findByRole("switch", { name: /จอครัว/ }));
  await user.click(screen.getByRole("button", { name: "บันทึก" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("ชื่อร้านซ้ำ");
});

test("asks before leaving with unsaved changes (AC-5)", async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(await screen.findByRole("switch", { name: /QR ที่เคาน์เตอร์/ }));
  await user.click(screen.getByRole("link", { name: "ไปหน้าโต๊ะ" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("ยังไม่ได้บันทึก")).toBeInTheDocument();

  await user.click(within(dialog).getByRole("button", { name: "อยู่ต่อ" }));
  expect(push).not.toHaveBeenCalled();
  await user.click(screen.getByRole("link", { name: "ไปหน้าโต๊ะ" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "ออกโดยไม่บันทึก" }));
  expect(push).toHaveBeenCalledWith("/pos/tables");
});

test("an untouched form follows a refresh from another tab: not dirty, nothing to save", async () => {
  const user = userEvent.setup();
  const client = renderScreen();
  const kitchen = await screen.findByRole("switch", { name: /จอครัว/ });
  expect(kitchen).not.toBeChecked();

  await refetchWithKitchenOn(client);

  await waitFor(() => expect(kitchen).toBeChecked());
  expect(screen.getByRole("button", { name: "บันทึก" })).toBeDisabled();
  await user.click(screen.getByRole("link", { name: "ไปหน้าโต๊ะ" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("a refresh keeps the user's edit and takes the server value for the rest", async () => {
  const user = userEvent.setup();
  const bodies = bodiesOf("/venue/settings");
  const client = renderScreen();
  const name = await screen.findByRole("textbox", { name: "ชื่อร้าน" });
  await user.clear(name);
  await user.type(name, "ร้านใหม่");

  await refetchWithKitchenOn(client);

  await waitFor(() => expect(screen.getByRole("switch", { name: /จอครัว/ })).toBeChecked());
  expect(name).toHaveValue("ร้านใหม่");
  await user.click(screen.getByRole("button", { name: "บันทึก" }));
  expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
  expect(bodies).toEqual([{ name: "ร้านใหม่" }]);
});

test("changes the PromptPay account and shows the new mask (AC-6)", async () => {
  server.use(
    http.patch("*/api/venue/payment-settings", () =>
      HttpResponse.json(
        apiEnvelope({ paymentMode: "own_promptpay", promptpayIdType: "mobile", promptpayIdMasked: "XXX-XXX-9999" }),
      ),
    ),
  );
  const user = userEvent.setup();
  const bodies = bodiesOf("/venue/payment-settings");
  renderScreen();

  expect(await screen.findByText("XXX-XXX-5678")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "เปลี่ยนบัญชี" }));
  await user.type(screen.getByRole("textbox", { name: "หมายเลขพร้อมเพย์" }), "0899999999");
  await user.click(screen.getByRole("button", { name: "บันทึกบัญชี" }));

  expect(await screen.findByText("XXX-XXX-9999")).toBeInTheDocument();
  expect(bodies).toEqual([{ promptpayId: "0899999999", promptpayIdType: "mobile" }]);
});

test("keeps the account and shows the in-flight alert while a QR is pending (AC-6)", async () => {
  const user = userEvent.setup();
  renderScreen();

  await user.click(await screen.findByRole("button", { name: "เปลี่ยนบัญชี" }));
  await user.type(screen.getByRole("textbox", { name: "หมายเลขพร้อมเพย์" }), "0899999999");
  await user.click(screen.getByRole("button", { name: "บันทึกบัญชี" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("มี QR รอชำระอยู่ — ปิดหรือยกเลิกก่อนเปลี่ยนบัญชี");
  await user.click(screen.getByRole("button", { name: "ยกเลิก" }));
  await waitFor(() => expect(screen.getByText("XXX-XXX-5678")).toBeInTheDocument());
});

test("shows Gateway as disabled with เร็วๆ นี้ (AC-7)", async () => {
  renderScreen();
  const gateway = await screen.findByRole("radio", { name: /Gateway/ });
  expect(gateway).toBeDisabled();
  expect(screen.getByText("เร็วๆ นี้")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /PromptPay ของร้าน/ })).toBeChecked();
});
