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
import { Badge } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePendingTicketCount } from "@/hooks/useTicketBoard";
import { permissionForPath } from "@/lib/permissions/pos-routes";
import { usePermissions } from "@/lib/permissions/usePermissions";
import { cn } from "@/lib/utils/cn";

interface RailItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: "/pos/menu" | "/pos/orders" | "/pos/reports" | "/pos/settings" | "/pos/tables";
}

const items: RailItem[] = [
  { key: "tables", label: "โต๊ะ", icon: Grid2x2, href: "/pos/tables" },
  { key: "orders", label: "ออเดอร์", icon: ReceiptText, href: "/pos/orders" },
  { key: "pay", label: "ชำระเงิน", icon: Banknote },
  { key: "menu", label: "เมนู", icon: BookOpen, href: "/pos/menu" },
  { key: "guests", label: "แขก", icon: Users },
  { key: "reports", label: "รายงาน", icon: ChartColumn, href: "/pos/reports" },
  { key: "settings", label: "ตั้งค่า", icon: Settings, href: "/pos/settings" },
];

const itemClass = (active: boolean) =>
  cn(
    "flex size-16 flex-col items-center justify-center gap-0.5 rounded-btn text-label",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    active ? "bg-accent-soft-strong text-text-accent" : "text-text-faint hover:bg-surface-hover",
  );

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PosRail() {
  const pathname = usePathname();
  const pendingTickets = usePendingTicketCount();
  const { can } = usePermissions();
  // Items without a page yet ("เร็ว ๆ นี้") follow the back-office tier until their pages exist.
  const shown = items.filter((item) => (item.href ? can(permissionForPath(item.href) ?? "tables:read") : can("reports:read")));

  return (
    <div className="flex w-22 shrink-0 flex-col border-r border-line-hairline bg-bg-sunken">
      <div className="flex h-14 flex-col items-center justify-center border-b border-line-hairline text-small font-bold leading-none tracking-caps text-text-accent">
        <span>THE</span>
        <span>LOFT</span>
      </div>
      <nav aria-label="เมนูหลัก" className="flex flex-col items-center gap-0.5 py-2">
        {shown.map((item) => {
          const Icon = item.icon;
          const active = item.href !== undefined && isActive(item.href, pathname);
          const icon = <Icon size={24} strokeWidth={1.75} aria-hidden />;
          const body = (
            <>
              {item.key === "orders" && pendingTickets > 0 ? (
                <Badge.Anchor>
                  {icon}
                  <Badge color="danger" size="sm" aria-label={`รอรับ ${pendingTickets} ออเดอร์`}>
                    {pendingTickets}
                  </Badge>
                </Badge.Anchor>
              ) : (
                icon
              )}
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
