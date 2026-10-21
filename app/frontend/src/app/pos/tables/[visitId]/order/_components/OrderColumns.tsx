"use client";

import { toast } from "@heroui/react";
import type { MenuCategory, MenuItem } from "@bar/contracts";
import type { CartAction, CartState } from "../cart";
import { CartPanel } from "./CartPanel";
import { MenuPanel } from "./MenuPanel";

export function OrderColumns({
  visitId,
  label,
  items,
  categories,
  counts,
  query,
  categoryId,
  status,
  disconnected,
  locked,
  onQuery,
  onCategory,
  onRetry,
  onPick,
  state,
  dispatch,
  onLeave,
}: Readonly<{
  visitId: string;
  label: string;
  items: MenuItem[];
  categories: MenuCategory[];
  counts: ReadonlyMap<string, number>;
  query: string;
  categoryId: string;
  status: "loading" | "error" | "ready";
  disconnected: boolean;
  locked: boolean;
  onQuery: (value: string) => void;
  onCategory: (id: string) => void;
  onRetry: () => void;
  onPick: (item: MenuItem) => void;
  state: CartState;
  dispatch: (action: CartAction) => void;
  onLeave: () => void;
}>) {
  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <MenuPanel
        items={items}
        categories={categories}
        counts={counts}
        query={query}
        categoryId={categoryId}
        status={status}
        disconnected={disconnected}
        locked={locked}
        onQuery={onQuery}
        onCategory={onCategory}
        onRetry={onRetry}
        onPick={onPick}
      />
      <CartPanel
        visitId={visitId}
        state={state}
        dispatch={dispatch}
        onSent={(count) => {
          toast.success(`ส่งออเดอร์ ${label} แล้ว · ${count} รายการ`);
          onLeave();
        }}
        onLeave={onLeave}
      />
    </div>
  );
}
