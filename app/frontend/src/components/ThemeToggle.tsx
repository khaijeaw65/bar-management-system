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
    <fieldset className="m-0 flex min-w-0 gap-1 border-0 p-0">
      <legend className="sr-only">ธีม</legend>
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
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              selected ? "bg-accent-soft text-text-accent" : "text-text-muted",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
