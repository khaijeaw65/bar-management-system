"use client";

import { Button } from "@heroui/react";
import { formatTHB } from "@/lib/utils/format";
import { QtyStepper } from "../../_components/QtyStepper";

export function SheetFooter({
  quantity,
  existing,
  ready,
  total,
  onQuantity,
  onSubmit,
}: Readonly<{
  quantity: number;
  existing: boolean;
  ready: boolean;
  total: string;
  onQuantity: (quantity: number) => void;
  onSubmit: () => void;
}>) {
  const removing = existing && quantity === 0;
  const label = existing ? `อัปเดตตะกร้า · ${formatTHB(total)}` : `เพิ่มลงตะกร้า · ${formatTHB(total)}`;
  return (
    <>
      <QtyStepper value={quantity} min={existing ? 0 : 1} onChange={onQuantity} />
      <Button size="lg" className="min-h-13 flex-1" variant={removing ? "danger" : "primary"} isDisabled={!ready} onPress={onSubmit}>
        {removing ? "ลบออกจากตะกร้า" : label}
      </Button>
    </>
  );
}
