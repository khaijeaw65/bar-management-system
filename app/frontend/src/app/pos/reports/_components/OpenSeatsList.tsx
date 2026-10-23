import type { ReportToday } from "@bar/contracts";
import { Card } from "@heroui/react";
import { Clock } from "lucide-react";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { formatThaiTime } from "../../tables/_components/table-time";

// Seats open this long are shown in warning colour (CD-05 R3, like CD-02 idle) — visual only.
const LONG_OPEN_MS = 3 * 3600 * 1000;

export function OpenSeatsList({ seats, now }: Readonly<{ seats: ReportToday["openSeats"]; now: string }>) {
  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="text-heading">ที่นั่งที่เปิดอยู่ {seats.length}</Card.Title>
      </Card.Header>
      <Card.Content>
        {seats.length === 0 ? (
          <p className="text-small text-text-muted">ไม่มีที่นั่งเปิดอยู่</p>
        ) : (
          <ul aria-label="ที่นั่งที่เปิดอยู่" className="flex flex-col gap-2">
            {seats.map((seat) => {
              const long = Date.parse(now) - Date.parse(seat.openedAt) >= LONG_OPEN_MS;
              return (
                <li key={`${seat.seatLabel}-${seat.openedAt}`} className="flex items-center gap-3">
                  <span className="w-12 text-body-strong">{seat.seatLabel}</span>
                  <span className={cn("flex flex-1 items-center gap-1 text-small tabular-nums", long ? "text-warning-fg" : "text-text-muted")}>
                    {long ? <Clock size={14} aria-hidden /> : null}
                    {formatThaiTime(seat.openedAt)}
                    {long ? <span className="sr-only">เปิดนาน</span> : null}
                  </span>
                  <span className="tabular-nums">{formatTHB(seat.total)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
