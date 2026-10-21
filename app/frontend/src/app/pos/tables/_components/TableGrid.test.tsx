import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { toast, Toast } from "@heroui/react";
import { apiEnvelope, attachedVisitId, currentSeats } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { formatElapsed } from "./table-time";
import { TableGrid } from "./TableGrid";

const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => nav.params,
  usePathname: () => "/pos/tables",
}));

vi.mock("socket.io-client", () => ({
  io: () => {
    const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    return {
      on(event: string, listener: (...args: unknown[]) => void) {
        const set = handlers.get(event) ?? new Set();
        set.add(listener);
        handlers.set(event, set);
      },
      off(event: string, listener: (...args: unknown[]) => void) {
        handlers.get(event)?.delete(listener);
      },
      connect() {},
      disconnect() {},
      removeAllListeners() {
        handlers.clear();
      },
    };
  },
}));

afterEach(() => {
  nav.replace.mockReset();
  nav.params = new URLSearchParams();
  toast.clear();
  resetStaffSocket();
  server.events.removeAllListeners();
});

function renderGrid() {
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
  return render(<TableGrid />, { wrapper: Wrap });
}

test("shows the four card states in sort order with summary counts", async () => {
  renderGrid();
  expect(await screen.findByRole("button", { name: "C1" })).toBeInTheDocument();

  const counter = screen.getByRole("heading", { name: "เคาน์เตอร์" }).closest("section");
  const tables = screen.getByRole("heading", { name: "โต๊ะ", level: 2 }).closest("section");
  expect(counter).not.toBeNull();
  expect(tables).not.toBeNull();
  const counterNames = within(counter as HTMLElement).getAllByRole("button").map((button) => button.textContent);
  const tableNames = within(tables as HTMLElement).getAllByRole("button").map((button) => button.textContent);
  expect(counterNames[0]).toContain("C1");
  expect(counterNames[1]).toContain("C4");
  expect(counterNames[1]).toContain("เปิดแล้ว");
  expect(counterNames[1]).toContain("รอออเดอร์");
  expect(counterNames[1]).toContain("ฟ้า");
  expect(tableNames.map((name) => name?.slice(0, 2))).toEqual(["T3", "T2", "T6", "T5"]);

  const active = currentSeats().find((seat) => seat.label === "T3");
  const elapsed = formatElapsed(active?.currentVisit?.openedAt ?? "", Date.now());
  expect(screen.getByRole("button", { name: /T3/ })).toHaveTextContent(`5 รายการ · ${elapsed}`);
  expect(screen.getByRole("button", { name: /T3/ })).toHaveTextContent("฿1,240.00");
  expect(screen.getByText("มิ้นท์, เจ, ต้อม และเพื่อนอีกหลายคน")).toHaveClass("truncate");
  expect(screen.getByRole("button", { name: /T2/ })).toHaveTextContent("รอชำระ");
  expect(screen.getByText("ใช้งาน 3")).toBeInTheDocument();
  expect(screen.getByText("ว่าง 3")).toBeInTheDocument();
});

test("loading, empty, and error states", async () => {
  server.use(
    http.get("*/api/tables", () => HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR", "เกิดข้อผิดพลาด"), { status: 500 }), {
      once: true,
    }),
  );
  renderGrid();
  expect(await screen.findByRole("alert")).toHaveTextContent("โหลดข้อมูลโต๊ะไม่สำเร็จ");
  await userEvent.click(screen.getByRole("button", { name: "ลองอีกครั้ง" }));
  expect(await screen.findByRole("button", { name: "C1" })).toBeInTheDocument();
});

test("an empty floor has no settings button", async () => {
  server.use(http.get("*/api/tables", () => HttpResponse.json(apiEnvelope({ items: [] }))));
  renderGrid();
  expect(await screen.findByText("ยังไม่มีโต๊ะ — เพิ่มโต๊ะในหน้าตั้งค่า")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+ เปิดโต๊ะ" })).toBeDisabled();
  expect(screen.queryByText(/ใช้งาน/)).not.toBeInTheDocument();
});

test("tapping an occupied card selects it and a free card opens the form", async () => {
  renderGrid();
  const active = currentSeats().find((seat) => seat.label === "T3");
  await userEvent.click(await screen.findByRole("button", { name: /T3/ }));
  expect(nav.replace).toHaveBeenCalledWith(`/pos/tables?visit=${active?.currentVisit?.id}`);

  await userEvent.click(screen.getByRole("button", { name: "C1" }));
  const dialog = await screen.findByRole("dialog", { name: "เปิดโต๊ะ" });
  expect(within(dialog).getByRole("button", { name: /C1/ })).toBeInTheDocument();
});

test("a selected visit gets the ring", async () => {
  const paying = currentSeats().find((seat) => seat.label === "T2");
  nav.params = new URLSearchParams({ visit: paying?.currentVisit?.id ?? "" });
  renderGrid();
  const card = await screen.findByRole("button", { name: /T2/ });
  expect(card).toHaveAttribute("aria-pressed", "true");
  expect(card.className).toContain("ring-line-accent");
});

test("formatElapsed counts whole minutes from openedAt", () => {
  expect(formatElapsed("2026-10-21T10:00:00.000Z", Date.parse("2026-10-21T11:24:30.000Z"))).toBe("1:24");
  expect(formatElapsed("2026-10-21T10:00:00.000Z", Date.parse("2026-10-21T10:00:40.000Z"))).toBe("0:00");
});

test("opening T6 sends one request, toasts, and turns the card open", async () => {
  const posts: unknown[] = [];
  server.events.on("request:start", ({ request }) => {
    if (request.method === "POST" && request.url.includes("/api/visits")) {
      void request.clone().json().then((body) => posts.push(body));
    }
  });
  renderGrid();
  const seat = currentSeats().find((item) => item.label === "T6");
  await userEvent.click(await screen.findByRole("button", { name: "T6" }));
  const dialog = await screen.findByRole("dialog", { name: "เปิดโต๊ะ" });
  await userEvent.type(within(dialog).getByRole("textbox", { name: "ชื่อแขก (ไม่บังคับ)" }), "แพร");
  await userEvent.click(within(dialog).getByRole("button", { name: "เปิดโต๊ะ" }));

  expect(await screen.findByText("เปิด T6 แล้ว")).toBeInTheDocument();
  expect(screen.getByText("แขก แพร")).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /T6/ })).toHaveTextContent("เปิดแล้ว");
  expect(screen.getByRole("button", { name: /T6/ })).toHaveTextContent("แพร");
  await vi.waitFor(() => expect(posts).toHaveLength(1));
  expect(posts[0]).toEqual({ tableSeatId: seat?.id, guestLabel: "แพร", via: "pos" });
});

test("an attached QR open asks and choosing another seat sends no second request", async () => {
  const posts: unknown[] = [];
  server.events.on("request:start", ({ request }) => {
    if (request.method === "POST" && request.url.includes("/api/visits")) {
      void request.clone().json().then((body) => posts.push(body));
    }
  });
  renderGrid();
  await userEvent.click(await screen.findByRole("button", { name: "T5" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "เปิดโต๊ะ" })).getByRole("button", { name: "เปิดโต๊ะ" }));

  const asked = await screen.findByRole("dialog", { name: "T5 เพิ่งถูกเปิดไปแล้ว" });
  expect(within(asked).getByText("ลูกค้า (สแกน QR)")).toBeInTheDocument();
  expect(within(asked).getByText("21:12 น.")).toBeInTheDocument();
  expect(within(asked).getByText("ฝน")).toBeInTheDocument();
  await vi.waitFor(() => expect(posts).toHaveLength(1));

  await userEvent.click(screen.getByRole("button", { name: "เลือกโต๊ะอื่น" }));
  expect(await screen.findByRole("dialog", { name: "เปิดโต๊ะ" })).toBeInTheDocument();
  expect(screen.getByText("เลือกโต๊ะที่ว่าง")).toBeInTheDocument();
  expect(posts).toHaveLength(1);
});

test("joining the existing visit sets the visit param", async () => {
  renderGrid();
  await userEvent.click(await screen.findByRole("button", { name: "T5" }));
  await userEvent.click(within(await screen.findByRole("dialog", { name: "เปิดโต๊ะ" })).getByRole("button", { name: "เปิดโต๊ะ" }));
  await userEvent.click(await screen.findByRole("button", { name: "เข้าโต๊ะเดิม (ฝน)" }));
  expect(nav.replace).toHaveBeenCalledWith(`/pos/tables?visit=${attachedVisitId}`);
});

test("a failed open keeps the guest name", async () => {
  server.use(
    http.post("*/api/visits", () => HttpResponse.json(apiEnvelope(null, 500, "INTERNAL_ERROR", "ล้มเหลว"), { status: 500 })),
  );
  renderGrid();
  await userEvent.click(await screen.findByRole("button", { name: "T6" }));
  const dialog = await screen.findByRole("dialog", { name: "เปิดโต๊ะ" });
  const guest = within(dialog).getByRole("textbox", { name: "ชื่อแขก (ไม่บังคับ)" });
  await userEvent.type(guest, "แพร");
  await userEvent.click(within(dialog).getByRole("button", { name: "เปิดโต๊ะ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("เปิดโต๊ะไม่สำเร็จ ลองอีกครั้ง");
  expect(guest).toHaveValue("แพร");
});

test("no free seat disables open and the select says so", async () => {
  server.use(
    http.get("*/api/tables", () => {
      const taken = currentSeats().filter((seat) => seat.currentVisit);
      return HttpResponse.json(apiEnvelope({ items: taken }));
    }),
  );
  renderGrid();
  await userEvent.click(await screen.findByRole("button", { name: "+ เปิดโต๊ะ" }));
  const dialog = await screen.findByRole("dialog", { name: "เปิดโต๊ะ" });
  expect(within(dialog).getByText("ไม่มีโต๊ะว่าง")).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: "เปิดโต๊ะ" })).toBeDisabled();
});

test("the seat list offers only free seats", async () => {
  const user = userEvent.setup();
  renderGrid();
  await user.click(await screen.findByRole("button", { name: "+ เปิดโต๊ะ" }));
  const dialog = await screen.findByRole("dialog", { name: "เปิดโต๊ะ" });
  await user.click(within(dialog).getByRole("button", { name: /เลือกโต๊ะที่ว่าง/ }));
  const options = screen.getAllByRole("option").map((option) => option.textContent);
  expect(options).toEqual(["C1", "T6", "T5"]);
});
