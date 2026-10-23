import { cn } from "@/lib/utils/cn";
import { formatThaiTime } from "../../tables/_components/table-time";

export function LiveStatus({ generatedAt, stale }: Readonly<{ generatedAt: string; stale: boolean }>) {
  return (
    <output className="flex items-center gap-2 text-small text-text-muted">
      <span aria-hidden className={cn("size-2 rounded-pill", stale ? "bg-text-faint" : "bg-success-fg")} />
      {`อัปเดต ${formatThaiTime(generatedAt)} · ${stale ? "ไม่ได้อัปเดต" : "สด"}`}
    </output>
  );
}
