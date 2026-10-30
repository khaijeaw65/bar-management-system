"use client";

import type { CustomerSession } from "@bar/contracts";
import { toast } from "@heroui/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCartContext } from "../_hooks/cart-context";
import { useCustomerLive } from "../_hooks/useCustomerLive";
import { CustomerHeader } from "./CustomerHeader";
import { GuestClosed } from "./GuestClosed";
import { LiveBanner } from "./LiveBanner";

/** Everything inside the cart provider: the live socket, the closed-table screen and the header. */
export function CustomerFrame({ session, children }: Readonly<{ session: CustomerSession; children: ReactNode }>) {
  const { state, dispatch } = useCartContext();
  // `sessionEnded` over the socket and a 409 at send both mean the table was closed; saveCart drops the stored cart.
  const { lost } = useCustomerLive(() => dispatch({ type: "closed" }));
  const pathname = usePathname();

  // Cleanup runs before the next page's effects, so the Toast raised by this navigation survives.
  useEffect(() => () => toast.clear(), [pathname]);

  if (state.closed) return <GuestClosed />;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-bg-app">
      <CustomerHeader session={session} />
      {lost ? <LiveBanner /> : null}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
