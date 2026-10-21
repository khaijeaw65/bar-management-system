import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { Toast, toast } from "@heroui/react";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { formatTHB } from "@/lib/utils/format";
import { SessionDrawer } from "./SessionDrawer";
import { closedVisit, drawerVisitId, visitDetail } from "./session.fixture";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("socket.io-client", () => ({
  io: () => ({
    on() {},
    off() {},
    connect() {},
    disconnect() {},
    removeAllListeners() {},
  }),
}));

afterEach(() => {
  toast.clear();
  resetStaffSocket();
  server.events.removeAllListeners();
});

function renderDrawer(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        {children}
      </QueryClientProvider>
    );
  }
  render(<SessionDrawer visitId={drawerVisitId} onClose={onClose} />, { wrapper: Wrap });
  return onClose;
}

function postsOf(urls: string[]) {
  server.events.on("request:start", ({ request }) => {
    if (request.method === "POST" && request.url.includes("/close")) urls.push(request.url);
  });
}

test("close sends one request when nothing is owed", async () => {
  const detail = visitDetail({ bill: { total: "120.00", paid: "120.00", remaining: "0.00", locked: false } });
  const posts: string[] = [];
  postsOf(posts);
  server.use(
    http.get("*/api/visits/:id", () => HttpResponse.json(apiEnvelope(detail))),
    http.post("*/api/visits/:id/close", () => HttpResponse.json(apiEnvelope(closedVisit(detail)))),
  );
  const onClose = renderDrawer();
  await userEvent.click(await screen.findByRole("button", { name: "ปิดโต๊ะ" }));
  const confirm = await screen.findByRole("dialog", { name: "ปิดโต๊ะ T3?" });
  expect(within(confirm).getByText("ยอดรวม").parentElement).toHaveTextContent(formatTHB("120.00"));
  await userEvent.click(within(confirm).getByRole("button", { name: "ปิดโต๊ะ" }));
  expect(await screen.findByText("ปิดโต๊ะ T3 แล้ว")).toBeInTheDocument();
  expect(onClose).toHaveBeenCalledOnce();
  expect(posts).toHaveLength(1);
});

test("an outstanding balance sends no close request", async () => {
  const posts: string[] = [];
  postsOf(posts);
  server.use(
    http.get("*/api/visits/:id", () =>
      HttpResponse.json(apiEnvelope(visitDetail({ bill: { total: "320.00", paid: "0.00", remaining: "320.00", locked: false } }))),
    ),
  );
  renderDrawer();
  await userEvent.click(await screen.findByRole("button", { name: "ปิดโต๊ะ" }));
  const confirm = await screen.findByRole("dialog", { name: "ปิดโต๊ะ T3?" });
  expect(within(confirm).getByRole("alert")).toHaveTextContent(`ยังมียอดค้างชำระ ${formatTHB("320.00")}`);
  expect(within(confirm).getByRole("button", { name: "ปิดโต๊ะ" })).toBeDisabled();
  expect(posts).toHaveLength(0);
});

test("a payment in flight closes the confirm and blocks the drawer", async () => {
  server.use(
    http.get("*/api/visits/:id", () => HttpResponse.json(apiEnvelope(visitDetail()))),
    http.post("*/api/visits/:id/close", () =>
      HttpResponse.json(apiEnvelope(null, 409, "PAYMENT_IN_FLIGHT", "มีการชำระเงินค้างอยู่"), { status: 409 }),
    ),
  );
  renderDrawer();
  await userEvent.click(await screen.findByRole("button", { name: "ปิดโต๊ะ" }));
  const confirm = await screen.findByRole("dialog", { name: "ปิดโต๊ะ T3?" });
  await userEvent.click(within(confirm).getByRole("button", { name: "ปิดโต๊ะ" }));
  const drawer = await screen.findByRole("dialog", { name: "โต๊ะ T3" });
  expect(within(drawer).getByRole("alert")).toHaveTextContent("มีการชำระเงินค้างอยู่ ปิดโต๊ะไม่ได้");
  expect(within(drawer).getByRole("button", { name: "ปิดโต๊ะ" })).toBeDisabled();
  expect(screen.queryByRole("dialog", { name: "ปิดโต๊ะ T3?" })).not.toBeInTheDocument();
});

test("a visit closed on another screen closes this drawer", async () => {
  server.use(
    http.get("*/api/visits/:id", () => HttpResponse.json(apiEnvelope(visitDetail()))),
    http.post("*/api/visits/:id/close", () =>
      HttpResponse.json(apiEnvelope(null, 409, "INVALID_STATE_TRANSITION", "สถานะโต๊ะไม่ถูกต้อง"), { status: 409 }),
    ),
  );
  const onClose = renderDrawer();
  await userEvent.click(await screen.findByRole("button", { name: "ปิดโต๊ะ" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "ปิดโต๊ะ T3?" })).getByRole("button", { name: "ปิดโต๊ะ" }));
  expect(await screen.findByText("โต๊ะนี้ถูกปิดไปแล้ว")).toBeInTheDocument();
  expect(onClose).toHaveBeenCalledOnce();
});

test("a network failure stays in the confirm and retries", async () => {
  const detail = visitDetail();
  const posts: string[] = [];
  postsOf(posts);
  server.use(
    http.get("*/api/visits/:id", () => HttpResponse.json(apiEnvelope(detail))),
    http.post("*/api/visits/:id/close", () => HttpResponse.error(), { once: true }),
    http.post("*/api/visits/:id/close", () => HttpResponse.json(apiEnvelope(closedVisit(detail)))),
  );
  const onClose = renderDrawer();
  await userEvent.click(await screen.findByRole("button", { name: "ปิดโต๊ะ" }));
  const confirm = await screen.findByRole("dialog", { name: "ปิดโต๊ะ T3?" });
  await userEvent.click(within(confirm).getByRole("button", { name: "ปิดโต๊ะ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("ปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง");
  await userEvent.click(within(screen.getByRole("dialog", { name: "ปิดโต๊ะ T3?" })).getByRole("button", { name: "ปิดโต๊ะ" }));
  expect(await screen.findByText("ปิดโต๊ะ T3 แล้ว")).toBeInTheDocument();
  expect(posts).toHaveLength(2);
  expect(onClose).toHaveBeenCalledOnce();
});
