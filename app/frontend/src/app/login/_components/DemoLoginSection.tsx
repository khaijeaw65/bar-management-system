"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import type { DemoLoginRole } from "@bar/contracts";
import { demoLogin } from "@/lib/api/auth";

const ROLES: Array<{ role: DemoLoginRole; label: string }> = [
  { role: "owner", label: "Demo เจ้าของ" },
  { role: "manager", label: "Demo ผู้จัดการ" },
  { role: "staff", label: "Demo พนักงาน" },
];

export function DemoLoginSection() {
  const [activeRole, setActiveRole] = useState<DemoLoginRole | null>(null);

  async function handleLogin(role: DemoLoginRole) {
    if (activeRole) return;
    setActiveRole(role);
    try {
      await demoLogin(role);
      // Hard navigation to reset client state and load with fresh session cookies.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch {
      setActiveRole(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
      <p className="text-center text-xs text-text-muted">เข้าสู่ระบบทดสอบ (Dev / Demo)</p>
      <div className="flex flex-col gap-2">
        {ROLES.map(({ role, label }) => (
          <Button
            key={role}
            size="md"
            variant="secondary"
            fullWidth
            isDisabled={activeRole !== null}
            isPending={activeRole === role}
            onPress={() => void handleLogin(role)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
