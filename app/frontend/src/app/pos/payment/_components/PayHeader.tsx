"use client";

import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";

interface PayHeaderProps {
  businessDate: string;
}

export function PayHeader({ businessDate }: Readonly<PayHeaderProps>) {
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      setClock(`${formatted} น.`);
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-btn bg-accent-soft-strong text-text-accent">
          <Banknote className="size-5" />
        </div>
        <h1 className="text-title font-semibold text-text-primary">ศูนย์การชำระเงิน</h1>
      </div>
      <p className="text-small text-text-muted">
        {businessDate ? `รอบวันธุรกิจ ${businessDate}` : "กำลังโหลดรอบวัน..."}
        {clock ? ` · เวลาปัจจุบัน ${clock}` : ""}
      </p>
    </div>
  );
}
