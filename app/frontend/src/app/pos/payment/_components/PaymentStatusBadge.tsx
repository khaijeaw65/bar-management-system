"use client";

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-btn bg-status-served-bg px-2 py-0.5 text-micro font-medium text-status-served-fg">
        สำเร็จ
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center rounded-btn bg-surface-raised px-2 py-0.5 text-micro font-medium text-text-muted">
        ยกเลิก
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-btn bg-accent-soft px-2 py-0.5 text-micro font-medium text-text-accent">
      รอดำเนินการ
    </span>
  );
}

export function confirmLabel(via: string | null): string {
  if (via === "webhook") return "Webhook อัตโนมัติ";
  if (via === "slip_verify") return "สแกนสลิป";
  if (via === "manual") return "ยืนยันเอง";
  if (via === "cash") return "เงินสด";
  return "-";
}
