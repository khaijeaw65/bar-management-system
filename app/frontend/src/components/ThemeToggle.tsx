"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const options = [
  { value: "dark", label: "ธีมมืด" },
  { value: "light", label: "ธีมสว่าง" },
  { value: "system", label: "ตามระบบ" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <div role="group" aria-label="ธีม" className="flex gap-1">
      {options.map((option) => {
        const selected = isClient && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              "h-10 rounded-md px-3 text-sm font-medium",
              selected ? "bg-accent-subtle text-accent-text" : "text-text-secondary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
