import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "@/lib/api/auth";
import * as useMeHook from "@/hooks/useMe";
import { renderWithClient } from "@/test/renderWithClient";
import { StaffAccount } from "./StaffAccount";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("StaffAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useMeHook, "useMe").mockReturnValue({
      data: {
        id: "user-123",
        displayName: "Field Demo",
        avatarUrl: null,
      },
    } as ReturnType<typeof useMeHook.useMe>);
  });

  it("displays role switch options and calls demoLogin when selected in non-production", async () => {
    const demoLoginSpy = vi.spyOn(authApi, "demoLogin").mockResolvedValue({ ok: true });

    renderWithClient(<StaffAccount />);

    const trigger = screen.getByRole("button", { name: "บัญชี Field Demo" });
    await userEvent.click(trigger);

    expect(screen.getByRole("menuitem", { name: "สลับเป็น เจ้าของ" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "สลับเป็น ผู้จัดการ" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "สลับเป็น พนักงาน" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("menuitem", { name: "สลับเป็น ผู้จัดการ" }));

    expect(demoLoginSpy).toHaveBeenCalledWith("manager");
  });

  it("omits role switch options in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");

    renderWithClient(<StaffAccount />);

    const trigger = screen.getByRole("button", { name: "บัญชี Field Demo" });
    await userEvent.click(trigger);

    expect(screen.queryByRole("menuitem", { name: "สลับเป็น เจ้าของ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "สลับเป็น ผู้จัดการ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "สลับเป็น พนักงาน" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "ออกจากระบบ" })).toBeInTheDocument();

    vi.unstubAllEnvs();
  });
});
