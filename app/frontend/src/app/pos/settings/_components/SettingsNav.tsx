"use client";

import { Button, Drawer } from "@heroui/react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePendingRequestCount } from "@/hooks/useAccessRequests";
import { permissionForPath } from "@/lib/permissions/pos-routes";
import { usePermissions } from "@/lib/permissions/usePermissions";
import { cn } from "@/lib/utils/cn";

// Tabs for tables join when their routes exist; each one is shown only if the shared route map lets the person in.
const TABS = [
  { href: "/pos/settings", label: "ร้าน" },
  { href: "/pos/settings/staff", label: "พนักงาน" },
  { href: "/pos/settings/groups", label: "กลุ่มสิทธิ์" },
  { href: "/pos/settings/policies", label: "นโยบายสิทธิ์ · ขั้นสูง" },
] as const;

function isActive(href: string, pathname: string): boolean {
  return href === "/pos/settings" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = (active: boolean) =>
  cn(
    "flex min-h-11 items-center gap-2 rounded-btn px-4 text-body",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    active ? "bg-accent-soft-strong text-text-accent" : "text-text-muted hover:bg-surface-hover",
  );

export function SettingsNav() {
  const pathname = usePathname();
  const { can } = usePermissions();
  const pending = usePendingRequestCount();
  const [open, setOpen] = useState(false);
  const shown = TABS.filter((tab) => {
    const needs = permissionForPath(tab.href);
    return needs === null || can(needs);
  });
  const current = shown.find((tab) => isActive(tab.href, pathname));
  const labelOf = (tab: (typeof TABS)[number]) =>
    tab.href === "/pos/settings/staff" && pending > 0 ? `${tab.label} (${pending})` : tab.label;

  if (shown.length === 0) return null;

  return (
    <>
      <nav aria-label="ตั้งค่า" className="hidden gap-1 border-b border-line-hairline pb-2 md:flex">
        {shown.map((tab) => (
          <Link key={tab.href} href={tab.href} aria-current={isActive(tab.href, pathname) ? "page" : undefined} className={linkClass(isActive(tab.href, pathname))}>
            {labelOf(tab)}
          </Link>
        ))}
      </nav>
      <div className="md:hidden">
        <Button variant="secondary" size="lg" aria-label="เมนูตั้งค่า" onPress={() => setOpen(true)} className="min-h-11">
          <Menu size={20} aria-hidden />
          {current ? labelOf(current) : "ตั้งค่า"}
        </Button>
        <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
          <Drawer.Content placement="left">
            <Drawer.Dialog aria-label="เมนูตั้งค่า">
              <Drawer.Body>
                <nav aria-label="ตั้งค่า (มือถือ)" className="flex flex-col gap-1">
                  {shown.map((tab) => (
                    <Link key={tab.href} href={tab.href} onClick={() => setOpen(false)} aria-current={isActive(tab.href, pathname) ? "page" : undefined} className={linkClass(isActive(tab.href, pathname))}>
                      {labelOf(tab)}
                    </Link>
                  ))}
                </nav>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </div>
    </>
  );
}
