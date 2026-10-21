"use client";

import { toast } from "@heroui/react";
import type { MenuItem } from "@bar/contracts";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getVisit } from "@/lib/api/visits";
import type { CartLine, NewLine } from "../cart";
import { quickVariant, lineFrom } from "../catalog";
import { useCart } from "../_hooks/useCart";
import { useMenuSync } from "../_hooks/useMenuSync";
import { useOrderMenu } from "../_hooks/useOrderMenu";
import { CartPanel } from "./CartPanel";
import { ItemSheet } from "./ItemSheet";
import { LeaveDialog } from "./LeaveDialog";
import { MenuPanel } from "./MenuPanel";
import { OrderHeader } from "./OrderHeader";

function countsOf(lines: readonly CartLine[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(line.itemId, (counts.get(line.itemId) ?? 0) + line.quantity);
  return counts;
}

function OrderOverlays({
  sheet,
  names,
  leaving,
  onCloseSheet,
  onRemember,
  onAdd,
  onStay,
  onDiscard,
}: Readonly<{
  sheet: MenuItem | null;
  names: readonly string[];
  leaving: boolean;
  onCloseSheet: () => void;
  onRemember: (name: string) => void;
  onAdd: (line: NewLine) => void;
  onStay: () => void;
  onDiscard: () => void;
}>) {
  return (
    <>
      {sheet ? <ItemSheet key={sheet.id} item={sheet} names={names} onClose={onCloseSheet} onRemember={onRemember} onAdd={onAdd} /> : null}
      {leaving ? <LeaveDialog onStay={onStay} onDiscard={onDiscard} /> : null}
    </>
  );
}

export function OrderScreen({ visitId }: Readonly<{ visitId: string }>) {
  const router = useRouter();
  const visit = useQuery({ queryKey: ["visits", visitId], queryFn: () => getVisit(visitId), retry: false });
  const menu = useOrderMenu();
  const { state, dispatch } = useCart();
  const [sheet, setSheet] = useState<MenuItem | null>(null);
  const [leaving, setLeaving] = useState(false);
  const items = menu.items.data?.items;
  useMenuSync(items, state.lines, dispatch);

  useEffect(() => {
    const visitState = visit.data?.state;
    if (visitState === "closed" || visitState === "abandoned") dispatch({ type: "closed" });
  }, [visit.data?.state, dispatch]);

  function leave(): void {
    router.push(`/pos/tables?visit=${visitId}`);
  }

  function back(): void {
    if (state.closed || state.lines.length === 0) {
      leave();
      return;
    }
    setLeaving(true);
  }

  function pick(item: MenuItem): void {
    if (state.pending || state.closed) return;
    const variant = quickVariant(item);
    if (!variant) {
      setSheet(item);
      return;
    }
    dispatch({ type: "add", line: lineFrom(item, variant, [], null, null, 1) });
    toast.success(`เพิ่ม ${item.name} แล้ว`, {
      actionProps: { children: "เลิกทำ", onPress: () => dispatch({ type: "undo" }) },
    });
  }

  const status = menu.items.isPending || menu.categories.isPending ? "loading" : menu.items.isError || menu.categories.isError ? "error" : "ready";

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <OrderHeader label={visit.data?.seatLabel ?? "…"} onBack={back} />
      <div className="flex min-h-0 flex-1 gap-4">
        <MenuPanel
          items={items ?? []}
          categories={menu.categories.data?.items ?? []}
          counts={countsOf(state.lines)}
          query={menu.query}
          categoryId={menu.categoryId}
          status={status}
          disconnected={menu.disconnected}
          locked={state.pending || state.closed}
          onQuery={menu.setQuery}
          onCategory={menu.setCategoryId}
          onRetry={menu.refetch}
          onPick={pick}
        />
        <CartPanel
          visitId={visitId}
          state={state}
          dispatch={dispatch}
          onSent={(count) => {
            toast.success(`ส่งออเดอร์ ${visit.data?.seatLabel ?? ""} แล้ว · ${count} รายการ`);
            leave();
          }}
        />
      </div>
      <OrderOverlays
        sheet={sheet}
        names={state.names}
        leaving={leaving}
        onCloseSheet={() => setSheet(null)}
        onRemember={(name) => dispatch({ type: "rememberName", name })}
        onAdd={(line) => {
          dispatch({ type: "add", line });
          setSheet(null);
        }}
        onStay={() => setLeaving(false)}
        onDiscard={leave}
      />
    </section>
  );
}
