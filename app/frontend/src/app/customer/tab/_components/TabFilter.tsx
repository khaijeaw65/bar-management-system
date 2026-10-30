"use client";

import { cn } from "@/lib/utils/cn";
import type { TabFilter as Filter } from "../_lib/tab";

const OPTIONS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "all", label: "ทั้งหมด" },
  { value: "mine", label: "ของฉัน" },
];

// Single select: one option is always on, so it cannot be cleared.
export function TabFilter({ value, onChange }: Readonly<{ value: Filter; onChange: (value: Filter) => void }>) {
  return (
    <fieldset aria-label="ตัวกรองออเดอร์" className="m-0 flex gap-2 border-0 p-0">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-11 shrink-0 rounded-pill border px-4 text-small",
            option.value === value ? "border-line-accent bg-accent-soft text-text-accent" : "border-line text-text-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
