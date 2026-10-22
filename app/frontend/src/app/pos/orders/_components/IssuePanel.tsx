"use client";

import type { Ticket } from "@bar/contracts";
import { Button } from "@heroui/react";
import { formatThaiTime } from "../../tables/_components/table-time";
import { issueReasonLabel } from "./issue-reason";

export function IssuePanel({
  ticket,
  pending,
  onResolve,
}: Readonly<{ ticket: Ticket; pending: boolean; onResolve: () => void }>) {
  const issue = ticket.issue;
  if (!issue) return null;
  const item = ticket.items.find((line) => line.id === issue.itemId);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-danger-border bg-danger-bg p-3">
      <p className="text-body-strong text-danger-fg">{issueReasonLabel[issue.reason]}</p>
      {item ? <p className="text-body-md">รายการ: {item.name}</p> : null}
      {issue.note ? <p className="text-body-md">{issue.note}</p> : null}
      <p className="text-small text-text-muted">
        รายงานโดย {issue.reportedBy.displayName}
        {issue.escalatedAt ? ` · ส่งมาจากแอปพนักงาน ${formatThaiTime(issue.escalatedAt)}` : ""}
      </p>
      <Button fullWidth variant="primary" isPending={pending} onPress={onResolve}>
        ทำต่อ
      </Button>
      <Button fullWidth variant="secondary" isDisabled>
        ยกเลิกรายการที่มีปัญหา
      </Button>
      <Button fullWidth variant="secondary" isDisabled>
        เปลี่ยนรายการ
      </Button>
      <p className="text-small text-text-muted">ต้องใช้สิทธิ์ผู้จัดการ — รอระบบยกเลิกรายการ</p>
    </div>
  );
}
