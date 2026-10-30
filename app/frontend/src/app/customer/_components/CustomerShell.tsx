"use client";

import { Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useGuestSession } from "../_hooks/useGuestSession";
import { CartProvider } from "./CartProvider";
import { CustomerHeader } from "./CustomerHeader";
import { GuestExpired } from "./GuestExpired";

export function CustomerShell({ children }: Readonly<{ children: ReactNode }>) {
  const { query, gone } = useGuestSession();
  if (gone) return <GuestExpired />;
  if (query.isError) {
    return (
      <main className="p-4">
        <LoadError onRetry={() => void query.refetch()} />
      </main>
    );
  }
  if (!query.data) {
    return (
      <main aria-busy className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </main>
    );
  }
  return (
    <CartProvider sessionId={query.data.seat.id}>
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-bg-app">
        <CustomerHeader session={query.data} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </CartProvider>
  );
}
