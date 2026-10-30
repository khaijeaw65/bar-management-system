import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { CartProvider } from "../_components/CartProvider";

export const SEAT = "seat-test";

// Real providers, MSW answers the API: the same wiring the customer layout gives its screens.
export function renderCustomer(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrap({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <QueryClientProvider client={client}>
        <Toast.Provider placement="top end" />
        <CartProvider sessionId={SEAT}>{children}</CartProvider>
      </QueryClientProvider>
    );
  }
  return render(ui, { wrapper: Wrap });
}
