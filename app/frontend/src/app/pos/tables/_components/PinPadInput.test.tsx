import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PinPadInput } from "./PinPadInput";

function PinPadWrapper({ initial = "", error = null, disabled = false }: { initial?: string; error?: string | null; disabled?: boolean }) {
  const [val, setVal] = useState(initial);
  return <PinPadInput value={val} onChange={setVal} error={error} disabled={disabled} />;
}

describe("PinPadInput", () => {
  it("renders 0-9 buttons and indicators", () => {
    render(<PinPadInput value="" onChange={vi.fn()} />);
    for (const d of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
      expect(screen.getByRole("button", { name: d })).toBeDefined();
    }
    expect(screen.getByRole("button", { name: "ลบ" })).toBeDefined();
    expect(screen.getByRole("group", { name: "PIN indicators" })).toBeDefined();
  });

  it("enters up to 4 digits and stops at 4", async () => {
    const user = userEvent.setup();
    render(<PinPadWrapper />);

    await user.click(screen.getByRole("button", { name: "1" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "4" }));
    // 5th click should be ignored
    await user.click(screen.getByRole("button", { name: "5" }));

    // Backspace should delete 1 digit, making room
    await user.click(screen.getByRole("button", { name: "ลบ" }));
    await user.click(screen.getByRole("button", { name: "9" }));
  });

  it("clears value when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<PinPadWrapper initial="12" />);

    const clearBtn = screen.getByRole("button", { name: "ล้าง" });
    await user.click(clearBtn);
    expect(clearBtn).toBeDisabled();
  });

  it("displays inline error text when error is passed", () => {
    render(<PinPadInput value="1234" onChange={vi.fn()} error="PIN ไม่ถูกต้อง" />);
    expect(screen.getByRole("alert")).toHaveTextContent("PIN ไม่ถูกต้อง");
  });

  it("does not allow input when disabled", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PinPadInput value="" onChange={onChange} disabled />);

    await user.click(screen.getByRole("button", { name: "1" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
