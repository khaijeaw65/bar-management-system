"use client";

import { Badge, Button, Popover } from "@heroui/react";
import { Bell } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { useAcknowledgeCall, useOpenCalls } from "@/hooks/useStaffCalls";
import { callTitle, formatCallAge } from "@/lib/pos/alerts";
import { useMinuteClock } from "../tables/_components/table-time";

export function NotificationBell() {
  const calls = useOpenCalls();
  const acknowledge = useAcknowledgeCall();
  const now = useMinuteClock();
  const [open, setOpen] = useState(false);
  const icon = <Bell aria-hidden size={18} />;

  return (
    <Popover.Root isOpen={open} onOpenChange={setOpen}>
      <Button isIconOnly variant="ghost" aria-label={calls.length > 0 ? `การเรียกพนักงาน ${calls.length} รายการ` : "การเรียกพนักงาน"}>
        {calls.length > 0 ? (
          <Badge.Anchor>
            {icon}
            <Badge color="warning" size="sm">
              {calls.length}
            </Badge>
          </Badge.Anchor>
        ) : (
          icon
        )}
      </Button>
      <Popover.Content placement="bottom end" className="w-80">
        <Popover.Dialog aria-label="การเรียกพนักงาน" className="flex flex-col gap-3 p-3">
          {calls.length === 0 ? <p className="text-small text-text-muted">ไม่มีการเรียก</p> : null}
          {calls.map(({ seat, call }) => (
            <div key={seat.id} className="flex flex-col gap-2">
              <p className="text-small">
                {callTitle(seat.label, call)} · {formatCallAge(call.calledAt, now)}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" className="min-h-11" aria-label={`รับทราบ ${seat.label}`} onPress={() => acknowledge.mutate(seat.id)}>
                  รับทราบ
                </Button>
                <Link
                  href={(seat.currentVisit ? `/pos/tables?visit=${seat.currentVisit.id}` : "/pos/tables") as Route}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center px-2 text-small text-text-accent underline"
                >
                  ไปที่โต๊ะ
                </Link>
              </div>
            </div>
          ))}
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
