"use client";

import { Alert, Button } from "@heroui/react";
import type { MenuItem } from "@bar/contracts";
import { MenuTile } from "./MenuTile";

export function MenuResults({
  status,
  items,
  counts,
  locked,
  onRetry,
  onPick,
}: Readonly<{
  status: "loading" | "error" | "ready";
  items: MenuItem[];
  counts: ReadonlyMap<string, number>;
  locked: boolean;
  onRetry: () => void;
  onPick: (item: MenuItem) => void;
}>) {
  if (status === "loading") return <p className="text-text-muted">กำลังโหลดเมนู</p>;
  if (status === "error") {
    return (
      <Alert status="danger" role="alert">
        <Alert.Content>
          <Alert.Title>โหลดเมนูไม่สำเร็จ</Alert.Title>
          <Alert.Description>เกิดข้อผิดพลาด</Alert.Description>
        </Alert.Content>
        <Button size="sm" variant="secondary" onPress={onRetry}>
          ลองอีกครั้ง
        </Button>
      </Alert>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-1 py-6">
        <p>ไม่พบเมนูที่ค้นหา</p>
        <p className="text-small text-text-muted">ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง</p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.375rem,1fr))] gap-3 overflow-y-auto">
      {items.map((item) => (
        <MenuTile key={item.id} item={item} count={counts.get(item.id) ?? 0} locked={locked} onPick={onPick} />
      ))}
    </ul>
  );
}
