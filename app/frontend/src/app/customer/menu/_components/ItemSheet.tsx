"use client";

import type { CustomerMenuItem } from "@bar/contracts";
import { useReducer, useState } from "react";
import type { CartLine, NewLine } from "@/lib/order/cart";
import { lineFrom, selectionReady } from "@/lib/order/catalog";
import { createItemDraft, itemDraftReducer, type ItemDraft } from "@/lib/order/item-draft";
import { scaleMoney } from "@/lib/utils/money";
import { hasOptions } from "../../_lib/menu";
import { MenuPhoto } from "./MenuPhoto";
import { NoteField, NOTE_MAX } from "./NoteField";
import { OptionGroup } from "./OptionGroup";
import { SheetFooter } from "./SheetFooter";
import { SheetShell } from "./SheetShell";
import { VariantPicker } from "./VariantPicker";

export type SheetResult =
  | { kind: "add"; line: NewLine }
  | { kind: "update"; existing: CartLine; quantity: number; line: NewLine };

function initialDraft(item: CustomerMenuItem, existing: CartLine | undefined): ItemDraft {
  const draft = createItemDraft(item);
  return existing ? { ...draft, variantId: existing.variantId, notes: existing.notes ?? "" } : draft;
}

export function ItemSheet({
  item,
  existing,
  onClose,
  onSubmit,
}: Readonly<{
  item: CustomerMenuItem;
  existing: CartLine | undefined;
  onClose: () => void;
  onSubmit: (result: SheetResult) => void;
}>) {
  const [draft, dispatch] = useReducer(itemDraftReducer, { item, existing }, (arg) => initialDraft(arg.item, arg.existing));
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const variant = item.variants.find((entry) => entry.id === draft.variantId) ?? item.variants[0];
  const ready = variant ? selectionReady(variant, draft.optionIds) && draft.notes.length <= NOTE_MAX : false;
  const line = variant ? lineFrom(item, variant, draft.optionIds, null, draft.notes, Math.max(quantity, 1)) : null;

  function submit(): void {
    if (!line || !ready) return;
    onSubmit(existing ? { kind: "update", existing, quantity, line } : { kind: "add", line });
  }

  return (
    <SheetShell
      full={hasOptions(item)}
      title={item.name}
      onClose={onClose}
      footer={
        <SheetFooter
          quantity={quantity}
          existing={existing !== undefined}
          ready={ready}
          total={line ? scaleMoney(line.unitPrice, Math.max(quantity, 1)) : item.basePrice}
          onQuantity={setQuantity}
          onSubmit={submit}
        />
      }
    >
      {hasOptions(item) ? <MenuPhoto item={item} count={0} /> : null}
      {item.variants.length > 1 ? (
        <VariantPicker variants={item.variants} variantId={draft.variantId} onChange={(variantId) => dispatch({ type: "variant", variantId })} />
      ) : null}
      {variant?.modifierGroups.map((group) => (
        <OptionGroup key={group.id} group={group} optionIds={draft.optionIds} onChange={(optionIds) => dispatch({ type: "options", optionIds })} />
      ))}
      <NoteField notes={draft.notes} onChange={(value) => dispatch({ type: "notes", value })} />
    </SheetShell>
  );
}
