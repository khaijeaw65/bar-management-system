import type { TicketIssueReason } from "@bar/contracts";

export const issueReasonLabel: Record<TicketIssueReason, string> = {
  out_of_stock: "ของหมด",
  equipment: "อุปกรณ์ขัดข้อง",
  other: "อื่น ๆ",
};
