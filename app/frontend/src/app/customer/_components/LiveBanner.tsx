import { WifiOff } from "lucide-react";

export function LiveBanner() {
  return (
    <output className="flex items-center gap-2 bg-warning-soft px-4 py-2 text-small text-text-body">
      <WifiOff aria-hidden size={16} />
      การเชื่อมต่อขาดหาย · ข้อมูลอาจไม่ล่าสุด
    </output>
  );
}
