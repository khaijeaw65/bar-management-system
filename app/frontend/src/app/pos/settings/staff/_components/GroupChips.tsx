import type { StaffMembership } from "@bar/contracts";
import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils/cn";
import { formatFrom, formatUntil } from "./membership";

export function chipText(membership: StaffMembership, now: Date): string {
  if (membership.state === "expired") return `${membership.groupName} · หมดอายุ`;
  if (membership.state === "future") return `${membership.groupName} · ${formatFrom(membership.validFrom)}`;
  return membership.validUntil ? `${membership.groupName} · ${formatUntil(membership.validUntil, now)}` : membership.groupName;
}

export function GroupChips({ memberships, dimmed = false }: Readonly<{ memberships: StaffMembership[]; dimmed?: boolean }>) {
  const now = new Date();
  if (memberships.length === 0) return <span className="text-small text-text-muted">ยังไม่มีกลุ่ม</span>;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", dimmed && "opacity-50")}>
      {memberships.map((membership) => (
        <li key={membership.groupId}>
          <Chip size="sm" variant="soft" color={membership.state === "expired" ? "default" : "accent"} className={cn(membership.state === "expired" && "line-through")}>
            {chipText(membership, now)}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
