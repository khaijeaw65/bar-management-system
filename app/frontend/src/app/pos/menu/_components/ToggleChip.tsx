"use client";

import { Button } from "@heroui/react";
import type { ReactNode } from "react";

// A pill that is on or off; a row of them is a single- or multi-select filter.
export function ToggleChip({
  selected,
  onToggle,
  children,
}: Readonly<{ selected: boolean; onToggle: () => void; children: ReactNode }>) {
  return (
    <Button size="sm" variant={selected ? "primary" : "secondary"} aria-pressed={selected} onPress={onToggle}>
      {children}
    </Button>
  );
}
