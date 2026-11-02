import { Toast, toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/node";
import { usePosAlerts } from "./usePosAlerts";

const listeners = new Map<string, (payload: unknown) => void>();

vi.mock("@/hooks/useSocketEvent", () => ({
  useSocketEvent: (event: string, handler: (payload: unknown) => void) => {
    listeners.set(event, handler);
  },
  useDisconnected: () => false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/pos/tables",
}));

describe("usePosAlerts", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    listeners.clear();
    toast.clear();
  });

  afterEach(() => {
    toast.clear();
  });

  it("DEF-03: shows inline รับทราบ button on staff call toast and acknowledges on click", async () => {
    let acknowledgedSeatId: string | null = null;
    server.use(
      http.post("*/api/tables/:seatId/acknowledge-call", ({ params }) => {
        acknowledgedSeatId = String(params.seatId);
        return HttpResponse.json({ status: 200, code: "", message: "success", data: { ok: true } });
      }),
    );

    const user = userEvent.setup();

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <Toast.Provider placement="top end" />
          {children}
        </QueryClientProvider>
      );
    }

    renderHook(() => usePosAlerts(), { wrapper: Wrapper });

    const seatId = "11111111-1111-4111-8111-111111111111";
    act(() => {
      const onCalled = listeners.get("table.staff_called");
      onCalled?.({
        tableSeatId: seatId,
        reason: "bill",
        note: null,
        calledAt: new Date().toISOString(),
      });
    });

    const ackButton = await screen.findByRole("button", { name: "รับทราบ" });
    expect(ackButton).toBeInTheDocument();
    expect(ackButton).toHaveClass("mr-8");

    await user.click(ackButton);
    expect(acknowledgedSeatId).toBe(seatId);
  });

  it("DEF-12 / AC-7: order arrival toast action button maintains mr-8 clearance", async () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <Toast.Provider placement="top end" />
          {children}
        </QueryClientProvider>
      );
    }

    renderHook(() => usePosAlerts(), { wrapper: Wrapper });

    act(() => {
      const onOrder = listeners.get("order.created");
      onOrder?.({
        id: "30000000-0000-4000-8000-000000000021",
        visitId: "11111111-1111-4111-8111-111111111111",
        orderNumber: 2,
        businessDate: "2026-10-21",
        createdAt: new Date().toISOString(),
        createdBy: null,
        tickets: [
          {
            id: "60000000-0000-4000-8000-000000000021",
            orderId: "30000000-0000-4000-8000-000000000021",
            orderNumber: 2,
            station: "bar",
            status: "pending",
            seat: { id: "11111111-1111-4111-8111-111111111111", label: "T2", kind: "table" },
            items: [],
            issue: null,
            acceptedBy: null,
            sentAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: "120.00",
      });
    });

    const viewOrderBtn = await screen.findByRole("button", { name: "ดูออเดอร์" });
    expect(viewOrderBtn).toBeInTheDocument();
    expect(viewOrderBtn).toHaveClass("mr-8");
  });
});
