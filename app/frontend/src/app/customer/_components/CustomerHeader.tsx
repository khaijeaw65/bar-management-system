"use client";

import type { CustomerSession } from "@bar/contracts";
import { Button } from "@heroui/react";
import { Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatTHB } from "@/lib/utils/format";
import { useCustomerTab } from "../_hooks/useCustomerTab";
import { CallStaffButton } from "./CallStaffButton";

export function CustomerHeader({ session }: Readonly<{ session: CustomerSession }>) {
  const router = useRouter();
  const tab = useCustomerTab().data;
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line-hairline bg-surface-bar px-4 py-2 backdrop-blur-(--blur-bar)">
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <h1 className="text-heading text-text-body">โต๊ะ {session.seat.label}</h1>
        {session.displayName ? <span className="truncate text-small text-text-muted">· {session.displayName}</span> : null}
      </div>
      {tab?.visitId ? (
        <Button size="sm" variant="secondary" className="min-h-11" onPress={() => router.push("/customer/tab")}>
          <Receipt aria-hidden size={16} />
          บิลโต๊ะ {formatTHB(tab.total)}
        </Button>
      ) : null}
      <CallStaffButton />
    </header>
  );
}
