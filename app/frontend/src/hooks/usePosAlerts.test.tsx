import { Toast, toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createElement, type ReactNode } from "react";
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

    await user.click(ackButton);
    expect(acknowledgedSeatId).toBe(seatId);
  });
});
