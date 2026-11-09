import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { TableSummary, TodayPaymentsResponse } from "@bar/contracts";
import { server } from "@/mocks/node";
import { resetStaffSocket } from "@/lib/socket/socket";
import { PayScreen } from "./_components/PayScreen";

beforeAll(() => {
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => [];
  }
});

const socketListeners = new Map<string, Set<(...args: unknown[]) => void>>();

function emitSocket(event: string, data?: unknown) {
  const set = socketListeners.get(event);
  if (set) {
    for (const fn of set) {
      fn(data);
    }
  }
}

vi.mock("socket.io-client", () => ({
  io: () => ({
    on(event: string, listener: (...args: unknown[]) => void) {
      const set = socketListeners.get(event) ?? new Set();
      set.add(listener);
      socketListeners.set(event, set);
    },
    off(event: string, listener: (...args: unknown[]) => void) {
      socketListeners.get(event)?.delete(listener);
    },
    connect() {},
    disconnect() {},
    removeAllListeners() {
      socketListeners.clear();
    },
  }),
}));

vi.mock("@/app/pos/tables/_components/checkout/CheckoutModal", () => ({
  CheckoutModal: ({
    visitId,
    onClose,
  }: {
    visitId: string;
    onClose: () => void;
  }) => (
    <div data-testid="mock-checkout-modal" data-visit-id={visitId}>
      <span>Modal for {visitId}</span>
      <button type="button" onClick={onClose}>
        Close Modal
      </button>
    </div>
  ),
}));

const ID_TABLE_1 = "11111111-1111-4111-8111-111111111111";
const ID_VISIT_1 = "22222222-2222-4222-8222-222222222222";
const ID_TABLE_2 = "33333333-3333-4333-8333-333333333333";
const ID_VISIT_2 = "44444444-4444-4444-8444-444444444444";
const ID_TABLE_3 = "55555555-5555-4555-8555-555555555555";
const ID_PAY_1 = "66666666-6666-4666-8666-666666666666";
const ID_PAY_2 = "77777777-7777-4777-8777-777777777777";
const ID_VISIT_OLD_1 = "88888888-8888-4888-8888-888888888888";
const ID_PAY_3 = "99999999-9999-4999-8999-999999999999";
const ID_VISIT_OLD_2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const mockTables: TableSummary[] = [
  {
    id: ID_TABLE_1,
    label: "T1",
    kind: "table",
    sortOrder: 1,
    currentVisit: {
      id: ID_VISIT_1,
      state: "active",
      openedAt: "2026-11-02T18:00:00.000Z",
      guestLabel: "สมชาย",
      total: "520.00",
      itemCount: 3,
      staffCalled: false,
      paymentPending: false,
    },
    staffCall: null,
  },
  {
    id: ID_TABLE_2,
    label: "T2",
    kind: "table",
    sortOrder: 2,
    currentVisit: {
      id: ID_VISIT_2,
      state: "active",
      openedAt: "2026-11-02T18:30:00.000Z",
      guestLabel: "มานี",
      total: "1240.00",
      itemCount: 5,
      staffCalled: false,
      paymentPending: true,
    },
    staffCall: null,
  },
  {
    id: ID_TABLE_3,
    label: "T3",
    kind: "table",
    sortOrder: 3,
    currentVisit: null,
    staffCall: null,
  },
];

const mockTodayPayments: TodayPaymentsResponse = {
  businessDate: "2026-11-02",
  summary: {
    totalRevenue: "1850.00",
    promptpayTotal: "1250.00",
    cashTotal: "600.00",
    completedCount: 2,
    pendingCount: 1,
    cancelledCount: 0,
  },
  items: [
    {
      id: ID_PAY_1,
      visitId: ID_VISIT_2,
      seatLabel: "T2",
      partNo: 1,
      partCount: 1,
      amount: "1240.00",
      method: "promptpay",
      status: "pending",
      confirmedVia: null,
      slipTransRef: null,
      statusReason: null,
      paidAt: null,
      createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    },
    {
      id: ID_PAY_2,
      visitId: ID_VISIT_OLD_1,
      seatLabel: "Bar 1",
      partNo: 1,
      partCount: 1,
      amount: "1250.00",
      method: "promptpay",
      status: "completed",
      confirmedVia: "webhook",
      slipTransRef: "REF-001",
      statusReason: null,
      paidAt: "2026-11-02T19:00:00.000Z",
      createdAt: "2026-11-02T18:55:00.000Z",
    },
    {
      id: ID_PAY_3,
      visitId: ID_VISIT_OLD_2,
      seatLabel: "T4",
      partNo: 1,
      partCount: 1,
      amount: "600.00",
      method: "cash",
      status: "completed",
      confirmedVia: "cash",
      slipTransRef: null,
      statusReason: null,
      paidAt: "2026-11-02T19:15:00.000Z",
      createdAt: "2026-11-02T19:15:00.000Z",
    },
  ],
};

function renderPayScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    ...render(<PayScreen />, { wrapper: Wrapper }),
    queryClient,
  };
}

describe("Web POS: Payment Center (/pos/payment)", () => {
  let tableFetchCount = 0;
  let todayFetchCount = 0;

  beforeEach(() => {
    tableFetchCount = 0;
    todayFetchCount = 0;

    server.use(
      http.get("*/api/tables", () => {
        tableFetchCount += 1;
        return HttpResponse.json({
          status: 200,
          code: "",
          message: "success",
          data: { items: mockTables },
        });
      }),
      http.get("*/api/payments/today", () => {
        todayFetchCount += 1;
        return HttpResponse.json({
          status: 200,
          code: "",
          message: "success",
          data: mockTodayPayments,
        });
      }),
    );
  });

  afterEach(() => {
    socketListeners.clear();
    resetStaffSocket();
    server.events.removeAllListeners();
  });

  test("AC-1: displays summary metrics and defaults to Tab 1 (รอชำระ)", async () => {
    renderPayScreen();

    expect(await screen.findByText("ศูนย์การชำระเงิน")).toBeInTheDocument();
    expect(await screen.findByText(/รอบวันธุรกิจ 2026-11-02/)).toBeInTheDocument();

    // Check summary metrics
    expect(screen.getByText("ยอดรวมชำระแล้ว")).toBeInTheDocument();
    expect(screen.getByText("฿1,850.00")).toBeInTheDocument();

    expect(screen.getByText("PromptPay")).toBeInTheDocument();
    expect(screen.getByText("฿1,250.00")).toBeInTheDocument();
    expect(screen.getByText("2 รายการ")).toBeInTheDocument();

    expect(screen.getByText("เงินสด")).toBeInTheDocument();
    expect(screen.getByText("฿600.00")).toBeInTheDocument();

    expect(screen.getByText("บิลรอชำระ")).toBeInTheDocument();
    expect(screen.getByText("2 โต๊ะ")).toBeInTheDocument();

    // Tab 1 is active by default
    const activeTab = screen.getByRole("tab", { name: /รอชำระ/ });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
  });

  test("AC-2: lists occupied tables with label, guest name, total, and 'ชำระเงิน' button", async () => {
    renderPayScreen();

    await screen.findByText("บิลเปิดรอคิดเงิน (1)");
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("สมชาย")).toBeInTheDocument();
    expect(screen.getByText("฿520.00")).toBeInTheDocument();
    expect(screen.getByText("3 รายการ")).toBeInTheDocument();

    const payButton = screen.getByRole("button", { name: /ชำระเงิน/ });
    expect(payButton).toBeInTheDocument();
  });

  test("AC-3: pins pending PromptPay QR table under 'กำลังรอเงินเข้า (PromptPay)' with countdown", async () => {
    renderPayScreen();

    await screen.findByText("กำลังรอเงินเข้า (PromptPay) — 1 โต๊ะ");
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.getByText("(มานี)")).toBeInTheDocument();
    expect(screen.getByText("฿1,240.00")).toBeInTheDocument();
    expect(screen.getByText(/กำลังรอชำระเงิน PromptPay QR/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ดู QR \/ จัดการ/ })).toBeInTheDocument();
  });

  test("AC-4: clicking 'ชำระเงิน' or 'ดู QR' opens CheckoutModal, and close refreshes data", async () => {
    const user = userEvent.setup();
    renderPayScreen();

    // Click "ชำระเงิน" on table T1
    const payBtn = await screen.findByRole("button", { name: /ชำระเงิน/ });
    await user.click(payBtn);

    const modal = await screen.findByTestId("mock-checkout-modal");
    expect(modal).toHaveAttribute("data-visit-id", ID_VISIT_1);

    // Close modal
    const initialTableCalls = tableFetchCount;
    await user.click(screen.getByRole("button", { name: "Close Modal" }));
    await waitFor(() => {
      expect(screen.queryByTestId("mock-checkout-modal")).not.toBeInTheDocument();
      expect(tableFetchCount).toBeGreaterThan(initialTableCalls);
    });

    // Click "ดู QR / จัดการ" on table T2
    const qrBtn = screen.getByRole("button", { name: /ดู QR \/ จัดการ/ });
    await user.click(qrBtn);

    const modal2 = await screen.findByTestId("mock-checkout-modal");
    expect(modal2).toHaveAttribute("data-visit-id", ID_VISIT_2);
  });

  test("AC-5: switching to Tab 2 shows today's payment history with filter chips", async () => {
    const user = userEvent.setup();
    renderPayScreen();

    const historyTab = await screen.findByRole("tab", {
      name: /ประวัติการชำระวันนี้/,
    });
    await user.click(historyTab);

    // Initial table shows all 3 items
    expect(await screen.findByText("Bar 1")).toBeInTheDocument();
    expect(screen.getByText("T4")).toBeInTheDocument();
    expect(screen.getByText("Webhook อัตโนมัติ")).toBeInTheDocument();

    // Filter by PromptPay
    const promptpayChip = screen.getByRole("button", { name: /^PromptPay/ });
    await user.click(promptpayChip);
    expect(screen.getByText("Bar 1")).toBeInTheDocument();
    expect(screen.queryByText("T4")).not.toBeInTheDocument();

    // Filter by Cash
    const cashChip = screen.getByRole("button", { name: /^เงินสด/ });
    await user.click(cashChip);
    expect(screen.queryByText("Bar 1")).not.toBeInTheDocument();
    expect(screen.getByText("T4")).toBeInTheDocument();
  });

  test("AC-6: realtime websocket event refreshes data without full reload", async () => {
    renderPayScreen();

    await screen.findByText("ศูนย์การชำระเงิน");
    const initialTableCalls = tableFetchCount;
    const initialTodayCalls = todayFetchCount;

    // Simulate backend sending payment.status_changed event
    emitSocket("payment.status_changed", { paymentId: ID_PAY_1 });

    await waitFor(() => {
      expect(tableFetchCount).toBeGreaterThan(initialTableCalls);
      expect(todayFetchCount).toBeGreaterThan(initialTodayCalls);
    });
  });
});
