import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "@/lib/api/auth";
import { LoginCard } from "./LoginCard";

const assign = vi.fn();

describe("LoginCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assign.mockReset();
    vi.stubGlobal("location", { assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders demo login buttons and switches role on click in non-production", async () => {
    const demoLoginSpy = vi.spyOn(authApi, "demoLogin").mockResolvedValue({ ok: true });

    render(<LoginCard failed={false} />);

    expect(screen.getByRole("button", { name: "Demo เจ้าของ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Demo ผู้จัดการ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Demo พนักงาน" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Demo ผู้จัดการ" }));

    expect(demoLoginSpy).toHaveBeenCalledWith("manager");
    await vi.waitFor(() => {
      expect(assign).toHaveBeenCalledWith("/");
    });
  });

  it("omits demo login buttons in production builds", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(<LoginCard failed={false} />);
    expect(screen.queryByRole("button", { name: "Demo เจ้าของ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Demo ผู้จัดการ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Demo พนักงาน" })).not.toBeInTheDocument();

    vi.unstubAllEnvs();
  });
});
