import type { ReportSummary } from "@bar/contracts";
import { toSatang } from "@/lib/utils/money";

export function PaymentSplit({
  payments,
  manualConfirmations,
}: Readonly<{ payments: ReportSummary["payments"]; manualConfirmations: number }>) {
  const promptpay = toSatang(payments.promptpay.amount);
  const total = promptpay + toSatang(payments.cash.amount);
  const promptpayPct = total === 0 ? 0 : Math.round((promptpay / total) * 100);
  const cashPct = total === 0 ? 0 : 100 - promptpayPct;

  return (
    <div className="flex flex-col gap-2">
      <svg
        role="img"
        aria-label={`PromptPay ${promptpayPct}% เงินสด ${cashPct}%`}
        className="h-2 w-full"
        preserveAspectRatio="none"
      >
        <rect width={`${promptpayPct}%`} height="100%" rx="2" className="fill-chart-1" />
        {cashPct > 0 ? (
          <rect x={`${promptpayPct}%`} width={`${cashPct}%`} height="100%" rx="2" className="fill-chart-2 stroke-surface-card stroke-2" />
        ) : null}
      </svg>
      <ul className="flex justify-between text-small tabular-nums">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-ds-xs bg-chart-1" />
          PromptPay {promptpayPct}%
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-ds-xs bg-chart-2" />
          เงินสด {cashPct}%
        </li>
      </ul>
      <span className="text-small text-text-muted">ยืนยันเอง {manualConfirmations} ครั้ง</span>
    </div>
  );
}
