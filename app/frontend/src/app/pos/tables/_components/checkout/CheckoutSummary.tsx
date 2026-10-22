import type { VisitDetail } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { lineCount } from "./payment";

function Row({ label, value, accent }: Readonly<{ label: string; value: string; accent?: boolean }>) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={accent ? "text-pos-total text-text-accent tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

export function CheckoutSummary({ visit }: Readonly<{ visit: VisitDetail }>) {
  return (
    <dl className="flex flex-col gap-1">
      <Row label="โต๊ะ" value={visit.seatLabel} />
      <Row label="รายการ" value={String(lineCount(visit))} />
      <Row label="ยอดรวม" value={formatTHB(visit.bill.total)} />
      <Row label="ชำระแล้ว" value={formatTHB(visit.bill.paid)} />
      <Row label="คงเหลือ" value={formatTHB(visit.bill.remaining)} accent />
    </dl>
  );
}
