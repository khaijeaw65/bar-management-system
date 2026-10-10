"use client";

import { Tag, TagGroup } from "@heroui/react";
import { cn } from "@/lib/utils/cn";
import { CATEGORIES, isCategoryId, type MenuCategoryId } from "./menu-data";

interface CategoryFiltersProps {
  selected: MenuCategoryId;
  onSelect: (category: MenuCategoryId) => void;
}

/** --dur-fast and --ease-out. Brief §7.6: no press scale. */
const motion = "duration-[140ms] ease-[cubic-bezier(.2,0,0,1)]";

const tagClass = cn(
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3.5 text-[13px] font-semibold leading-none whitespace-nowrap text-text-muted outline-none transition-[background-color,color,box-shadow]",
  motion,
  "hover:bg-surface-hover hover:text-text-body",
  "data-[selected]:border-transparent data-[selected]:bg-accent data-[selected]:text-text-on-accent",
  "data-[selected]:hover:bg-accent-hover",
  "focus-visible:shadow-(--glow-focus)",
);

export function CategoryFilters({ selected, onSelect }: CategoryFiltersProps) {
  return (
    <nav aria-label="หมวดเมนู">
      <TagGroup
        aria-label="หมวดเมนู"
        disallowEmptySelection
        selectedKeys={new Set([selected])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          for (const key of keys) {
            if (isCategoryId(key)) onSelect(key);
          }
        }}
      >
        <TagGroup.List className="flex flex-wrap gap-2 outline-none">
          {CATEGORIES.map((category) => (
            <Tag key={category.id} className={tagClass} id={category.id} textValue={category.label}>
              {category.label}
              <span className={cn("tabular-nums", category.id === selected ? "opacity-100" : "opacity-85")}>
                {category.count}
              </span>
            </Tag>
          ))}
        </TagGroup.List>
      </TagGroup>
    </nav>
  );
}
