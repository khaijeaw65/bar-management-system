"use client";

import { AlertDialog, Button } from "@heroui/react";
import type { Rename } from "../../_lib/draft";

export function RenameDialog({
  renames,
  onConfirm,
  onCancel,
}: Readonly<{ renames: Rename[]; onConfirm: () => void; onCancel: () => void }>) {
  return (
    <AlertDialog.Root isOpen onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialog.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>เปลี่ยนชื่อ?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-text-muted">ออเดอร์ที่สั่งไปแล้วยังใช้ชื่อเดิม ออเดอร์ใหม่ใช้ชื่อใหม่</p>
              <ul className="mt-3 flex flex-col gap-1">
                {renames.map((rename) => (
                  <li key={`${rename.kind}-${rename.from}`}>
                    {rename.kind === "item" ? "เมนู" : "ตัวเลือก"}: {rename.from} → {rename.to}
                  </li>
                ))}
              </ul>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" onPress={onCancel}>
                ยกเลิก
              </Button>
              <Button onPress={onConfirm}>ยืนยัน</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  );
}
