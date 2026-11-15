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
  const { lost, acknowledged, dismissAcknowledged } = useCustomerLive(() => dispatch({ type: "closed" }));
  const pathname = usePathname();

  // Cleanup runs before the next page's effects, so the Toast raised by this navigation survives.
  useEffect(() => () => toast.clear(), [pathname]);

  if (state.closed) return <GuestClosed />;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-bg-app">
      <CustomerHeader session={session} />
      {acknowledged ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-4 mt-2 flex items-center justify-between gap-2 rounded-card border border-success/40 bg-success-bg p-3 text-small text-success-fg"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            <span>พนักงานรับทราบแล้ว กำลังมาที่โต๊ะของคุณ</span>
          </div>
          <button
            type="button"
            aria-label="ปิดการแจ้งเตือน"
            onClick={dismissAcknowledged}
            className="text-text-muted hover:text-text-body"
          >
            ✕
          </button>
        </div>
      ) : null}
      {lost ? <LiveBanner /> : null}
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
