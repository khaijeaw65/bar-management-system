"use client";

import type { CustomerMenuItem } from "@bar/contracts";
import { useState } from "react";
import { useCartContext } from "../../_hooks/cart-context";
import { useCustomerMenu } from "../../_hooks/useCustomerMenu";
import { useSheetResult } from "../../_hooks/useSheetResult";
import { ALL, hasOptions, plainLine, sortedCategories, visibleItems } from "../../_lib/menu";
import { CartBar } from "./CartBar";
import { ItemSheet } from "./ItemSheet";
import { MenuBody } from "./MenuBody";
import { MenuToolbar } from "./MenuToolbar";

export function MenuScreen() {
  const menu = useCustomerMenu();
  const { state, dispatch } = useCartContext();
  const [categoryId, setCategoryId] = useState(ALL);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<CustomerMenuItem | null>(null);
  const apply = useSheetResult(dispatch, () => setPicked(null));
  const items = menu.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4 pb-4">
      <MenuToolbar
        categories={sortedCategories(menu.data?.categories ?? [])}
        categoryId={categoryId}
        query={query}
        onCategory={setCategoryId}
        onQuery={setQuery}
      />
      <MenuBody
        status={menu.status}
        items={visibleItems(items, categoryId, query)}
        lines={state.lines}
        searching={query.trim().length > 0}
        onPick={setPicked}
        onRetry={() => void menu.refetch()}
      />
      <CartBar lines={state.lines} />
      {picked ? (
        <ItemSheet
          key={picked.id}
          item={picked}
          existing={hasOptions(picked) ? undefined : plainLine(state.lines, picked.id)}
          onClose={() => setPicked(null)}
          onSubmit={apply}
        />
      ) : null}
    </div>
  );
}
