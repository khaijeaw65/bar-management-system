import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

export function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(ui, { wrapper: ({ children }: Readonly<{ children: ReactNode }>) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
}
