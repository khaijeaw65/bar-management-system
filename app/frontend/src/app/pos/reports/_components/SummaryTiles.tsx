import type { ReportSummary } from "@bar/contracts";
import { formatTHB } from "@/lib/utils/format";
import { toSatang } from "@/lib/utils/money";
import { deltaPercent } from "../period";
import { PaymentSplit } from "./PaymentSplit";
import { StatTile } from "./StatTile";

export function SummaryTiles({ summary }: Readonly<{ summary: ReportSummary }>) {
  const { previous } = summary;
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatTile
        label="ยอดขาย"
        value={formatTHB(summary.revenue)}
        delta={deltaPercent(toSatang(summary.revenue), toSatang(previous.revenue))}
      />
      <StatTile
        label="จำนวนบิล"
        value={summary.bills.toLocaleString("th-TH")}
        delta={deltaPercent(summary.bills, previous.bills)}
      />
      <StatTile
        label="เฉลี่ยต่อบิล"
        value={formatTHB(summary.averageBill)}
        delta={deltaPercent(toSatang(summary.averageBill), toSatang(previous.averageBill))}
      />
      <StatTile label="การชำระเงิน">
        <PaymentSplit payments={summary.payments} manualConfirmations={summary.manualConfirmations} />
      </StatTile>
    </div>
  );
}
