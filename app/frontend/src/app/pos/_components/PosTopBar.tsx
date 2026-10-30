import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { SoundToggle } from "./SoundToggle";
import { StaffAccount } from "./StaffAccount";
import { LiveClock } from "./LiveClock";

export function PosTopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-line-hairline bg-bg-sunken px-6">
      <div className="flex items-center gap-3">
        <p className="text-small font-bold tracking-caps">THE LOFT BAR</p>
        <span className="h-5 w-px bg-line" aria-hidden />
        <p className="text-small text-text-muted">เดอะ ลอฟท์ บาร์</p>
      </div>
      <div className="flex items-center gap-3">
        <SoundToggle />
        <NotificationBell />
        <StaffAccount />
        <LiveClock />
        <ThemeToggle />
      </div>
    </header>
  );
}
