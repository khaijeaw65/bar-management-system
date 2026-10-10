"use client";

import {
  Banknote,
  BookOpen,
  ChartColumn,
  Grid2x2,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface RailItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: "/pos/menu";
}

const items: RailItem[] = [
  { key: "tables", label: "โต๊ะ", icon: Grid2x2 },
  { key: "orders", label: "ออเดอร์", icon: ReceiptText },
  { key: "pay", label: "ชำระเงิน", icon: Banknote },
  { key: "menu", label: "เมนู", icon: BookOpen, href: "/pos/menu" },
  { key: "guests", label: "แขก", icon: Users },
  { key: "reports", label: "รายงาน", icon: ChartColumn },
  { key: "settings", label: "ตั้งค่า", icon: Settings },
];

const itemClass = (active: boolean) =>
  cn(
    "flex size-16 flex-col items-center justify-center gap-0.5 rounded-[10px] text-[10px] font-semibold leading-[1.2]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    active ? "bg-accent-soft-strong text-text-accent" : "text-text-faint hover:bg-surface-hover",
  );

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PosRail() {
  const pathname = usePathname();

  return (
    <div className="flex w-[88px] shrink-0 flex-col border-r border-line-hairline bg-bg-sunken">
      <div className="flex h-14 flex-col items-center justify-center border-b border-line-hairline text-[12px] font-bold leading-none tracking-[0.08em] text-text-accent">
        <span>THE</span>
        <span>LOFT</span>
      </div>
      <nav aria-label="เมนูหลัก" className="flex flex-col items-center gap-0.5 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href !== undefined && isActive(item.href, pathname);
          const body = (
            <>
              <Icon size={24} strokeWidth={1.75} aria-hidden />
              {item.label}
            </>
          );
          if (item.href === undefined) {
            return (
              <span key={item.key} aria-disabled="true" title="เร็ว ๆ นี้" className={itemClass(false)}>
                {body}
              </span>
            );
          }
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={itemClass(active)}
            >
              {body}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
