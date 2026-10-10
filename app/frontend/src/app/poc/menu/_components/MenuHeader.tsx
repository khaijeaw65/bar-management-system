"use client";

import { SearchField } from "@heroui/react";
import { Search, X } from "lucide-react";

interface MenuHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
}

/** --dur-fast and --ease-out. Brief §7.6: no press scale. */
const motion = "duration-[140ms] ease-[cubic-bezier(.2,0,0,1)]";

export function MenuHeader({ query, onQueryChange }: MenuHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold leading-[1.4] tracking-[0.08em] text-text-accent">
          {/* --text-label --ls-caps */}
          THE LOFT BAR
        </span>
        <h1 className="m-0 text-[34px] font-bold leading-[1.35] tracking-[-0.01em]">
          {/* --text-display --ls-display */}
          เมนู
        </h1>
      </div>
      <div className="flex w-[400px]">
        <SearchField aria-label="ค้นหาเมนู" className="w-full" value={query} onChange={onQueryChange}>
          <SearchField.Group
            className={`flex h-11 w-full items-center gap-2 rounded-[10px] border border-line bg-surface-input py-0 pr-1.5 pl-2.5 shadow-none transition-[border-color,box-shadow] ${motion} hover:border-line-strong focus-within:border-accent focus-within:shadow-(--glow-focus)`}
          >
            {/* h-11 is the board's 44px. rounded is --r-input. */}
            <SearchField.SearchIcon className="ms-0 text-text-faint">
              <Search aria-hidden className="size-4" strokeWidth={1.75} />
            </SearchField.SearchIcon>
            <SearchField.Input
              className="min-w-0 flex-1 bg-transparent px-0 py-0 text-[15px] font-normal leading-[1.62] text-text-body caret-accent outline-none placeholder:text-text-faint"
              placeholder="ค้นหาเมนู"
            />
            {/* --text-body-md. Placeholder is --text-faint (brief §7.5). */}
            {query !== "" ? (
              <SearchField.ClearButton
                aria-label="ล้างคำค้นหา"
                className="me-0 grid size-7 place-items-center rounded-[6px] text-text-faint"
              >
                {/* 28px box and --r-xs from SearchField.jsx. Icon 16. Shown only when value is set, as SearchField.jsx does. */}
                <X aria-hidden className="size-4" strokeWidth={1.75} />
              </SearchField.ClearButton>
            ) : null}
          </SearchField.Group>
        </SearchField>
      </div>
    </header>
  );
}
