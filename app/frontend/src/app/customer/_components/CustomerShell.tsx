"use client";

import { Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import { LoadError } from "@/components/ui/LoadError";
import { useGuestSession } from "../_hooks/useGuestSession";
import { CartProvider } from "./CartProvider";
import { CustomerFrame } from "./CustomerFrame";
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
      <CustomerFrame session={query.data}>{children}</CustomerFrame>
    </CartProvider>
  );
}
