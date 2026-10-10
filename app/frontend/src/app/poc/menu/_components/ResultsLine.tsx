import { cn } from "@/lib/utils/cn";

interface ResultsLineProps {
  count: number;
  query: string;
}

export function ResultsLine({ count, query }: ResultsLineProps) {
  const hasResults = count >= 1;
  return (
    <div
      className={cn(
        "text-[13px] font-normal leading-normal text-text-muted", // --text-small
        hasResults && "tabular-nums",
      )}
    >
      {hasResults ? `แสดง ${count} รายการ` : `ไม่พบผลลัพธ์สำหรับ “${query}”`}
    </div>
  );
}
