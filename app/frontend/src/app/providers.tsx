"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

const mockingEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

let mockingReady: Promise<void> | undefined;

function startMocking(): Promise<void> {
  if (!mockingEnabled) return Promise.resolve();
  // Strict mode runs the effect twice; a second worker.start() throws.
  mockingReady ??= import("@/mocks/browser")
    .then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: "bypass" });
    })
    .catch((error: unknown) => {
      console.error(error);
    });
  return mockingReady ?? Promise.resolve();
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    let active = true;
    void startMocking().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        {ready ? children : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
