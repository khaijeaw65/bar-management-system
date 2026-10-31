import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { onlyPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/node";
import { OrderEntryButton } from "./OrderEntryButton";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function renderButton() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<OrderEntryButton visitId="v1" />, { wrapper: ({ children }: Readonly<{ children: ReactNode }>) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}

test("shows สั่งแทนลูกค้า once orders:create is known", async () => {
  renderButton();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "สั่งแทนลูกค้า" })).toBeInTheDocument();
});

test("is not rendered without orders:create", async () => {
  server.use(onlyPermissions("tables:read"));
  renderButton();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
