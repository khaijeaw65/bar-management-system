import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toast } from "@heroui/react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { server } from "@/mocks/node";
import { ModifierGroupsScreen } from "./ModifierGroupsScreen";

export interface Sent {
  method: string;
  path: string;
  body: Record<string, unknown> | null;
}

export const sent: Sent[] = [];

// Records every non-GET request the screen makes.
export function recordWrites() {
  beforeEach(() => {
    server.events.on("request:start", async ({ request }) => {
      if (request.method === "GET") return;
      const text = await request.clone().text();
      sent.push({ method: request.method, path: new URL(request.url).pathname, body: text ? JSON.parse(text) : null });
    });
  });
  afterEach(() => {
    sent.length = 0;
    server.events.removeAllListeners();
  });
}

export function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Toast.Provider />
      <ModifierGroupsScreen />
    </QueryClientProvider>,
  );
}
