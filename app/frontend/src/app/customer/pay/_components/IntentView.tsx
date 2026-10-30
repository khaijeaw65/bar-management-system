import type { CustomerPayment } from "@bar/contracts";
import { Button } from "@heroui/react";
import { Banknote, QrCode } from "lucide-react";
import { formatTHB } from "@/lib/utils/format";

export function IntentView({
  payment,
  busy,
  failed,
  onCreate,
  onView,
  onCash,
}: Readonly<{
  payment: CustomerPayment;
  busy: boolean;
  failed: boolean;
  onCreate: () => void;
  onView: () => void;
  onCash: () => void;
}>) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-heading">ชำระเงิน</h2>
      <p className="text-title tabular-nums">ยอดทั้งโต๊ะ {formatTHB(payment.bill.remaining)}</p>
      {payment.pending ? (
        // One attempt at a time per table: someone already started, so this phone can only look (CD-07 D3).
        <Button size="lg" className="min-h-13" onPress={onView}>
          <QrCode aria-hidden size={18} />
          ดู QR
        </Button>
      ) : (
        <>
          <Button size="lg" className="min-h-13" isDisabled={busy} onPress={onCreate}>
            <QrCode aria-hidden size={18} />
            สร้าง QR พร้อมเพย์
          </Button>
          <Button size="lg" variant="secondary" className="min-h-13" onPress={onCash}>
            <Banknote aria-hidden size={18} />
            จ่ายเงินสด
          </Button>
        </>
      )}
      {failed ? (
        <p role="alert" className="text-small text-text-danger">
          สร้าง QR ไม่สำเร็จ ลองอีกครั้ง
        </p>
      ) : null}
    </div>
  );
}
