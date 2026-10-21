import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { apiEnvelope } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { SessionExpiredModal } from "./SessionExpiredModal";
import { SessionGate } from "./SessionGate";
import { StaffAccount } from "./StaffAccount";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/pos/menu",
}));

function unauthorized() {
  return HttpResponse.json(apiEnvelope(null, 401, "UNAUTHORIZED", "กรุณาเข้าสู่ระบบ"), { status: 401 });
}

function renderGate(client: QueryClient) {
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return render(
    <SessionGate>
      <StaffAccount />
    </SessionGate>,
    { wrapper: Wrap },
  );
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

test("shows the staff name when the session is valid", async () => {
  replace.mockReset();
  renderGate(client());
  expect(await screen.findByText("Beam")).toBeInTheDocument();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("first-load 401 goes to login without the modal", async () => {
  replace.mockReset();
  server.use(
    http.get("*/api/auth/me", () => unauthorized()),
    http.post("*/api/auth/refresh", () => unauthorized()),
  );
  renderGate(client());
  await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

test("refresh failure mid-use blocks the screen until login", async () => {
  replace.mockReset();
  const queryClient = client();
  renderGate(queryClient);
  expect(await screen.findByText("Beam")).toBeInTheDocument();

  server.use(
    http.get("*/api/auth/me", () => unauthorized()),
    http.post("*/api/auth/refresh", () => unauthorized()),
  );
  await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "เข้าสู่ระบบอีกครั้ง" }));
  expect(replace).toHaveBeenCalledWith("/login");
});

test("logout still reaches login when the network is down", async () => {
  replace.mockReset();
  server.use(http.post("*/api/auth/logout", () => HttpResponse.error()));
  renderGate(client());
  await userEvent.click(await screen.findByRole("button", { name: "บัญชี Beam" }));
  await userEvent.click(await screen.findByRole("menuitem", { name: "ออกจากระบบ" }));
  await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
});

test("logout posts then goes to login", async () => {
  replace.mockReset();
  let loggedOut = false;
  server.use(
    http.post("*/api/auth/logout", () => {
      loggedOut = true;
      return HttpResponse.json(apiEnvelope({ ok: true }));
    }),
  );
  renderGate(client());
  await userEvent.click(await screen.findByRole("button", { name: "บัญชี Beam" }));
  await userEvent.click(await screen.findByRole("menuitem", { name: "ออกจากระบบ" }));
  await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(loggedOut).toBe(true);
});

test("session modal goes to login after 5 seconds", async () => {
  vi.useFakeTimers();
  const onLogin = vi.fn();
  render(<SessionExpiredModal onLogin={onLogin} />);
  expect(screen.getByText(/ใน 5 วินาที/)).toBeInTheDocument();
  for (let step = 0; step < 5; step += 1) {
    await act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
  expect(onLogin).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
