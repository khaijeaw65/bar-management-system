"use client";

import type { ModifierGroupAdmin } from "@bar/contracts";
import { useState } from "react";
import { emptyGroup, groupDraftOf, isGroupDirty, newOption, type GroupDraft, type OptionDraft } from "../_lib/group";

export function useGroupDraft(group: ModifierGroupAdmin | undefined) {
  const [base] = useState(() => (group ? groupDraftOf(group) : emptyGroup()));
  const [draft, setDraft] = useState(base);

  const patch = (changes: Partial<GroupDraft>) => setDraft((current) => ({ ...current, ...changes }));
  const patchOption = (key: string, changes: Partial<OptionDraft>) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option) => (option.key === key ? { ...option, ...changes } : option)),
    }));

  return {
    draft,
    dirty: isGroupDirty(base, draft),
    patch,
    patchOption,
    addOption: () => setDraft((current) => ({ ...current, options: [...current.options, newOption()] })),
    removeOption: (key: string) =>
      setDraft((current) => ({ ...current, options: current.options.filter((option) => option.key !== key) })),
  };
}
