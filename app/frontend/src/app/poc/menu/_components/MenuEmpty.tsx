"use client";

import { Button, EmptyState } from "@heroui/react";
import { SearchX, X } from "lucide-react";

interface MenuEmptyProps {
  onClear: () => void;
}

/** --dur-fast and --ease-out. Brief §7.6: no press scale. */
const motion = "duration-[140ms] ease-[cubic-bezier(.2,0,0,1)]";

export function MenuEmpty({ onClear }: MenuEmptyProps) {
  return (
    <section
      aria-label="ผลการค้นหา"
      className="flex flex-grow flex-col items-center justify-center gap-2 pb-16"
    >
      <EmptyState className="grid justify-items-center gap-2 px-6 py-10 text-center">
        <span className="mb-1 grid size-12 place-items-center rounded-full bg-surface-raised text-text-faint">
          <SearchX aria-hidden className="size-6" strokeWidth={1.75} />
        </span>
        <div className="text-[17px] font-semibold leading-normal text-text-body">ไม่พบเมนูที่ค้นหา</div>
        {/* --text-subhead. Description max 280px and icon circle 48px are EmptyState.jsx literals. */}
        <div className="max-w-[280px] text-[13px] font-normal leading-normal text-text-faint">
          {/* --text-small, colour --text-faint */}
          ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหาเพื่อดูเมนูทั้งหมด
        </div>
      </EmptyState>
      <Button
        className={`h-11 gap-2 rounded-[10px] border border-line bg-surface-raised px-4 text-[15px] font-semibold leading-none text-text-body transition-[background-color] ${motion} hover:bg-surface-hover focus-visible:shadow-(--glow-focus) active:scale-100 data-[pressed]:scale-100`}
        size="md"
        variant="secondary"
        onPress={onClear}
      >
        {/* rounded --r-btn. Height 44 and icon 20 are Button md. */}
        <X aria-hidden className="size-5" strokeWidth={1.75} />
        ล้างคำค้นหา
      </Button>
    </section>
  );
}
