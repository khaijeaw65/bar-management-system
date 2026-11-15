"use client";

import { Avatar, Chip, Dropdown } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { DemoLoginRole } from "@bar/contracts";
import { useMe } from "@/hooks/useMe";
import { demoLogin, logout } from "@/lib/api/auth";
import { markSessionCleared } from "@/lib/api/client";

const DEMO_ROLES: Array<{ role: DemoLoginRole; label: string }> = [
  { role: "owner", label: "สลับเป็น เจ้าของ" },
  { role: "manager", label: "สลับเป็น ผู้จัดการ" },
  { role: "staff", label: "สลับเป็น พนักงาน" },
];

export function StaffAccount() {
  const me = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const staff = me.data;
  if (!staff) return null;

  const initial = staff.displayName.trim().slice(0, 1) || "?";

  async function signOut() {
    try {
      await logout();
    } catch {
      // AC-6: a dead network still leaves the POS.
    }
    markSessionCleared();
    queryClient.clear();
    router.replace("/login");
  }

  async function switchRole(role: DemoLoginRole) {
    try {
      await demoLogin(role);
      await queryClient.invalidateQueries();
    } catch {
      // network error
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Chip size="sm">{staff.displayName}</Chip>
      <Dropdown.Root>
        <Dropdown.Trigger aria-label={`บัญชี ${staff.displayName}`} className="rounded-full">
          <Avatar size="sm">
            {staff.avatarUrl ? <Avatar.Image src={staff.avatarUrl} alt="" /> : null}
            <Avatar.Fallback>{initial}</Avatar.Fallback>
          </Avatar>
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu>
            {process.env.NODE_ENV !== "production" ? (
              <Dropdown.Section aria-label="สลับบทบาท (Demo)">
                {DEMO_ROLES.map(({ role, label }) => (
                  <Dropdown.Item key={role} onAction={() => void switchRole(role)}>
                    {label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Section>
            ) : null}
            <Dropdown.Item onAction={() => void signOut()}>ออกจากระบบ</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown.Root>
    </div>
  );
}
