"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export function MenuEmpty({ noItems, canWrite }: Readonly<{ noItems: boolean; canWrite: boolean }>) {
  const router = useRouter();

  if (!noItems) {
    return (
      <div className="flex flex-col gap-1 py-8 text-center">
        <p className="text-text-body">ไม่พบเมนูที่ค้นหา</p>
        <p className="text-small text-text-muted">ลองค้นหาด้วยคำอื่น หรือเลือกหมวด ทั้งหมด</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-text-muted">ยังไม่มีเมนู</p>
      {canWrite ? <Button onPress={() => router.push("/pos/menu/new")}>เพิ่มเมนูแรก</Button> : null}
    </div>
  );
}
