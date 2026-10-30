"use client";

import { SearchField } from "@heroui/react";
import type { CustomerMenuCategory } from "@bar/contracts";
import { cn } from "@/lib/utils/cn";
import { ALL } from "../../_lib/menu";

export function MenuToolbar({
  categories,
  categoryId,
  query,
  onCategory,
  onQuery,
}: Readonly<{
  categories: readonly CustomerMenuCategory[];
  categoryId: string;
  query: string;
  onCategory: (id: string) => void;
  onQuery: (value: string) => void;
}>) {
  const chips = [{ id: ALL, name: "ทั้งหมด" }, ...categories];
  return (
    <div className="flex flex-col gap-3 px-4 pt-3">
      <SearchField aria-label="ค้นหาเมนู" value={query} onChange={onQuery}>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="ค้นหาเมนู" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <fieldset aria-label="หมวดหมู่" className="-mx-4 m-0 flex min-w-0 gap-2 overflow-x-auto border-0 px-4 pb-1">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={chip.id === categoryId}
            onClick={() => onCategory(chip.id)}
            className={cn(
              "h-11 shrink-0 rounded-pill border px-4 text-small",
              chip.id === categoryId ? "border-line-accent bg-accent-soft text-text-accent" : "border-line text-text-muted",
            )}
          >
            {chip.name}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
