"use client";

import type { MenuItem } from "@bar/contracts";
import { useState } from "react";
import { draftOf, emptyDraft, isDirty, newVariant, type MenuDraft, type VariantDraft } from "../_lib/draft";

// `item` is the copy the draft was loaded from (undefined = new). `reload` swaps in a fresher server copy.
export function useMenuDraft(initial: MenuItem | undefined) {
  const [item, setItem] = useState(initial);
  const [base, setBase] = useState(() => (initial ? draftOf(initial) : emptyDraft()));
  const [draft, setDraft] = useState(base);

  const patch = (changes: Partial<MenuDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const patchVariant = (key: string, changes: Partial<VariantDraft>) =>
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant) => (variant.key === key ? { ...variant, ...changes } : variant)),
    }));

  return {
    item,
    base,
    draft,
    dirty: isDirty(base, draft),
    patch,
    patchVariant,
    addVariant: () => setDraft((current) => ({ ...current, variants: [...current.variants, newVariant()] })),
    removeVariant: (key: string) =>
      setDraft((current) => ({ ...current, variants: current.variants.filter((variant) => variant.key !== key) })),
    toggleGroup: (id: string) =>
      setDraft((current) => ({
        ...current,
        modifierGroupIds: current.modifierGroupIds.includes(id)
          ? current.modifierGroupIds.filter((value) => value !== id)
          : [...current.modifierGroupIds, id],
      })),
    reload: (latest: MenuItem) => {
      const next = draftOf(latest);
      setItem(latest);
      setBase(next);
      setDraft(next);
    },
  };
}
