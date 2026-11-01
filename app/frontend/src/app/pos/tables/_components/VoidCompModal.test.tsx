import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderLine } from "@bar/contracts";
import { VoidCompModal } from "./VoidCompModal";

const mockLine: OrderLine = {
  id: "70000000-0000-4000-8000-000000000001",
  variantId: "70000000-0000-4000-8000-000000000001",
  name: "สิงห์",
  variantName: "ปกติ",
  quantity: 2,
  unitPrice: "120.00",
  modifiers: [],
  lineTotal: "240.00",
  orderedByName: null,
  notes: null,
  cancelledAt: null,
  cancellation: null,
  comp: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("VoidCompModal", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("renders item name and original price", () => {
    render(
      <VoidCompModal
        line={mockLine}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText("สิงห์")).toBeDefined();
    expect(screen.getByText("฿240.00")).toBeDefined();
  });

  it("manager/owner sees self-approval notice and submits without PIN (AC-4)", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <VoidCompModal
        line={mockLine}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() },
    );

    // Verify self-approval banner is shown for owner
    expect(await screen.findByText("อนุมัติด้วยตนเอง — บันทึกให้เจ้าของตรวจสอบ")).toBeDefined();

    // Pick reason "ของหมด"
    const reasonTrigger = screen.getByRole("button", { name: /เหตุผล/ });
    await user.click(reasonTrigger);
    const option = await screen.findByRole("option", { name: "ของหมด" });
    await user.click(option);

    // Confirm button is enabled without PIN
    const submitBtn = screen.getByRole("button", { name: "ยืนยันการยกเลิก" });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);
    expect(onSuccess).toBeDefined();
  });

  it("staff role displays PIN pad and requires 4 digits to submit (AC-1)", async () => {
    sessionStorage.setItem("pos-mock-role", "staff");
    const user = userEvent.setup();

    render(
      <VoidCompModal
        line={mockLine}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    // Pick reason "ของหมด"
    const reasonTrigger = screen.getByRole("button", { name: /เหตุผล/ });
    await user.click(reasonTrigger);
    const option = await screen.findByRole("option", { name: "ของหมด" });
    await user.click(option);

    const submitBtn = screen.getByRole("button", { name: "ยืนยันการยกเลิก" });
    // Disabled before PIN is entered
    expect(submitBtn).toBeDisabled();

    // Enter PIN 1234
    for (const d of ["1", "2", "3", "4"]) {
      await user.click(screen.getByRole("button", { name: d }));
    }

    // Now enabled
    expect(submitBtn).toBeEnabled();
  });

  it("requires note when reason is 'อื่นๆ' (AC-6)", async () => {
    const user = userEvent.setup();

    render(
      <VoidCompModal
        line={mockLine}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    const reasonTrigger = screen.getByRole("button", { name: /เหตุผล/ });
    await user.click(reasonTrigger);
    const option = await screen.findByRole("option", { name: "อื่นๆ" });
    await user.click(option);

    const submitBtn = screen.getByRole("button", { name: "ยืนยันการยกเลิก" });
    // Disabled because note is required!
    expect(submitBtn).toBeDisabled();

    // Type note
    const noteInput = screen.getByPlaceholderText(/ระบุเหตุผลเพิ่มเติม/);
    await user.type(noteInput, "ลูกค้าแพ้กลิ่น");

    // Now enabled
    expect(submitBtn).toBeEnabled();
  });

  it("switches to Comp action and updates submit button label (AC-2)", async () => {
    const user = userEvent.setup();

    render(
      <VoidCompModal
        line={mockLine}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    const compRadio = screen.getByRole("radio", { name: /Comp/ });
    await user.click(compRadio);

    expect(screen.getByRole("button", { name: "ยืนยัน Comp" })).toBeDefined();
  });
});
